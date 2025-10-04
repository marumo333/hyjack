<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentChunk;
use Google\GenerativeAI\Client;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class EmbeddingService
{
    private Client $client;
    private string $model;

    public function __construct()
    {
        $this->model = config('services.gemini.embedding_model', 'embedding-001');
        $apiKey = config('services.gemini.api_key');
        
        if (!$apiKey) {
            throw new Exception('Gemini API key not configured');
        }

        $this->client = new Client($apiKey);
    }

    /**
     * ドキュメントのチャンクに埋め込みを生成
     */
    public function generateEmbeddingsForDocument(Document $document): array
    {
        try {
            Log::info("Starting embedding generation", [
                'document_id' => $document->id,
                'title' => $document->title
            ]);

            $chunks = DocumentChunk::where('document_id', $document->id)
                ->where(function($query) {
                    $query->whereNull('embedding')
                          ->orWhere('embedding', '');
                })
                ->orderBy('chunk_index')
                ->get();

            if ($chunks->isEmpty()) {
                Log::info("No chunks to process for embedding", [
                    'document_id' => $document->id
                ]);
                return ['success' => true, 'processed_count' => 0];
            }

            $processedCount = 0;
            $batchSize = 10; // バッチサイズを小さくしてAPI制限に対応
            $chunkBatches = $chunks->chunk($batchSize);

            foreach ($chunkBatches as $batch) {
                $this->processBatch($batch, $document);
                $processedCount += $batch->count();
                
                // レート制限対策
                usleep(100000); // 100ms待機
            }

            Log::info("Embedding generation completed", [
                'document_id' => $document->id,
                'processed_count' => $processedCount
            ]);

            return [
                'success' => true,
                'processed_count' => $processedCount,
                'total_chunks' => $chunks->count()
            ];

        } catch (Exception $e) {
            Log::error("Embedding generation failed", [
                'document_id' => $document->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new Exception("Embedding generation failed: " . $e->getMessage());
        }
    }

    /**
     * バッチで埋め込みを処理
     */
    private function processBatch($chunks, Document $document): void
    {
        $startTime = microtime(true);

        foreach ($chunks as $chunk) {
            try {
                $embedding = $this->generateEmbedding($chunk->content);
                
                if ($embedding) {
                    $chunk->update([
                        'embedding' => json_encode($embedding),
                        'token_count' => $this->estimateTokenCount($chunk->content)
                    ]);
                } else {
                    Log::warning("Failed to generate embedding for chunk", [
                        'chunk_id' => $chunk->id,
                        'document_id' => $document->id
                    ]);
                }
            } catch (Exception $e) {
                Log::error("Failed to process chunk", [
                    'chunk_id' => $chunk->id,
                    'document_id' => $document->id,
                    'error' => $e->getMessage()
                ]);

                // 個別のチャンクエラーは続行
                continue;
            }
        }

        $processingTime = microtime(true) - $startTime;
        Log::info("Batch processed", [
            'batch_size' => $chunks->count(),
            'processing_time' => round($processingTime, 2),
            'throughput' => round($chunks->count() / $processingTime, 2) . ' chunks/sec'
        ]);
    }

    /**
     * 単一テキストの埋め込みを生成
     */
    public function generateEmbedding(string $text): ?array
    {
        try {
            // テキストの前処理
            $processedText = $this->preprocessText($text);
            
            if (empty($processedText)) {
                return null;
            }

            // Gemini APIで埋め込みを生成
            $response = $this->client->embedContent($this->model, $processedText);
            
            if (isset($response['embedding']['values'])) {
                return $response['embedding']['values'];
            }

            return null;

        } catch (Exception $e) {
            Log::error("Failed to generate embedding", [
                'text_length' => strlen($text),
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * クエリの埋め込みを生成
     */
    public function generateQueryEmbedding(string $query): ?array
    {
        try {
            $processedQuery = $this->preprocessQuery($query);
            
            if (empty($processedQuery)) {
                return null;
            }

            $response = $this->client->embedContent($this->model, $processedQuery);
            
            if (isset($response['embedding']['values'])) {
                return $response['embedding']['values'];
            }

            return null;

        } catch (Exception $e) {
            Log::error("Failed to generate query embedding", [
                'query' => substr($query, 0, 100),
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * テキストの前処理
     */
    private function preprocessText(string $text): string
    {
        // 不要な文字を除去
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        
        // 最大長制限
        $maxLength = 8000; // Geminiの制限に合わせて調整
        if (strlen($text) > $maxLength) {
            $text = substr($text, 0, $maxLength);
        }

        return $text;
    }

    /**
     * クエリの前処理
     */
    private function preprocessQuery(string $query): string
    {
        // クエリの前処理（テキストより厳しく）
        $query = preg_replace('/\s+/', ' ', $query);
        $query = trim($query);
        
        // クエリは短く保つ
        $maxLength = 1000;
        if (strlen($query) > $maxLength) {
            $query = substr($query, 0, $maxLength);
        }

        return $query;
    }

    /**
     * トークン数を推定
     */
    private function estimateTokenCount(string $text): int
    {
        // 簡易的な推定
        $japaneseChars = preg_match_all('/[\p{Hiragana}\p{Katakana}\p{Han}]/u', $text);
        $englishWords = str_word_count($text, 0, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
        
        return $japaneseChars + intval($englishWords * 1.3) + 20; // オーバーヘッドを考慮
    }

    /**
     * 埋め込みの品質を検証
     */
    public function validateEmbedding(array $embedding): bool
    {
        if (empty($embedding)) {
            return false;
        }

        // 次元数のチェック
        $expectedDimensions = config('services.gemini.embedding_dimensions', 768);
        if (count($embedding) !== $expectedDimensions) {
            Log::warning("Unexpected embedding dimensions", [
                'expected' => $expectedDimensions,
                'actual' => count($embedding)
            ]);
            return false;
        }

        // NaNや無限大の値がないかチェック
        foreach ($embedding as $value) {
            if (!is_numeric($value) || is_infinite($value) || is_nan($value)) {
                return false;
            }
        }

        return true;
    }

    /**
     * スループットを測定
     */
    public function measureThroughput(int $chunkCount): array
    {
        $startTime = microtime(true);
        
        // テスト用のダミーテキストで埋め込みを生成
        $testTexts = array_fill(0, min($chunkCount, 10), 'This is a test text for measuring embedding throughput.');
        
        foreach ($testTexts as $text) {
            $this->generateEmbedding($text);
        }
        
        $endTime = microtime(true);
        $processingTime = $endTime - $startTime;
        
        return [
            'chunks_processed' => count($testTexts),
            'processing_time' => round($processingTime, 2),
            'throughput' => round(count($testTexts) / $processingTime, 2) . ' chunks/sec'
        ];
    }

    /**
     * 埋め込み済みチャンクの統計を取得
     */
    public function getEmbeddingStatistics(Document $document = null): array
    {
        $query = DocumentChunk::query();
        
        if ($document) {
            $query->where('document_id', $document->id);
        }

        $totalChunks = $query->count();
        $embeddedChunks = $query->whereNotNull('embedding')
            ->where('embedding', '!=', '')
            ->count();

        return [
            'total_chunks' => $totalChunks,
            'embedded_chunks' => $embeddedChunks,
            'embedding_rate' => $totalChunks > 0 ? round(($embeddedChunks / $totalChunks) * 100, 2) : 0,
            'pending_chunks' => $totalChunks - $embeddedChunks
        ];
    }

    /**
     * 埋め込みを再生成（エラーがあった場合）
     */
    public function regenerateEmbeddings(Document $document): array
    {
        try {
            Log::info("Starting embedding regeneration", [
                'document_id' => $document->id
            ]);

            // 既存の埋め込みをクリア
            DocumentChunk::where('document_id', $document->id)
                ->update(['embedding' => null]);

            // 再生成
            return $this->generateEmbeddingsForDocument($document);

        } catch (Exception $e) {
            Log::error("Embedding regeneration failed", [
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}

