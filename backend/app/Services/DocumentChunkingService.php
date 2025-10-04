<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentChunk;
use Illuminate\Support\Facades\Log;
use Exception;

class DocumentChunkingService
{
    // チャンクサイズ制限
    const DEFAULT_CHUNK_SIZE = 1000; // 文字数
    const MIN_CHUNK_SIZE = 200;
    const MAX_CHUNK_SIZE = 2000;
    
    // 重複検出の閾値
    const SIMILARITY_THRESHOLD = 0.8;

    /**
     * 抽出されたドキュメントをチャンクに分割
     */
    public function chunkDocument(Document $document, array $extractedData): array
    {
        try {
            Log::info("Starting document chunking", [
                'document_id' => $document->id,
                'title' => $document->title
            ]);

            $chunks = [];
            $chunkIndex = 0;

            foreach ($extractedData['sheets'] as $sheet) {
                $sheetChunks = $this->chunkSheet($document, $sheet, $chunkIndex);
                $chunks = array_merge($chunks, $sheetChunks);
                $chunkIndex += count($sheetChunks);
            }

            // 重複チャンクを除去
            $chunks = $this->removeDuplicateChunks($chunks);

            // データベースに保存
            $this->saveChunks($document, $chunks);

            Log::info("Document chunking completed", [
                'document_id' => $document->id,
                'total_chunks' => count($chunks)
            ]);

            return [
                'success' => true,
                'chunk_count' => count($chunks),
                'chunks' => $chunks
            ];

        } catch (Exception $e) {
            Log::error("Document chunking failed", [
                'document_id' => $document->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new Exception("Document chunking failed: " . $e->getMessage());
        }
    }

    /**
     * シートをチャンクに分割
     */
    private function chunkSheet(Document $document, array $sheet, int $startIndex): array
    {
        $chunks = [];
        $chunkIndex = $startIndex;

        foreach ($sheet['chunks'] as $content) {
            $chunkSize = $this->calculateOptimalChunkSize($content['content']);
            $chunkedContent = $this->splitContent($content['content'], $chunkSize);

            foreach ($chunkedContent as $contentPart) {
                if (empty(trim($contentPart))) {
                    continue;
                }

                $chunks[] = [
                    'document_id' => $document->id,
                    'chunk_index' => $chunkIndex++,
                    'content' => trim($contentPart),
                    'content_type' => $content['content_type'],
                    'section_title' => $content['section_title'],
                    'metadata' => array_merge($content['metadata'], [
                        'sheet_name' => $sheet['sheet_name'],
                        'sheet_index' => $sheet['sheet_index'],
                        'chunk_size' => strlen($contentPart),
                        'word_count' => str_word_count($contentPart),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]),
                    'token_count' => $this->estimateTokenCount($contentPart),
                    'word_count' => str_word_count($contentPart)
                ];
            }
        }

        return $chunks;
    }

    /**
     * 最適なチャンクサイズを計算
     */
    private function calculateOptimalChunkSize(string $content): int
    {
        $contentLength = strlen($content);
        
        // コンテンツの長さに基づいて動的に調整
        if ($contentLength <= self::MIN_CHUNK_SIZE) {
            return $contentLength; // 小さすぎる場合はそのまま
        }
        
        if ($contentLength <= self::DEFAULT_CHUNK_SIZE) {
            return $contentLength; // デフォルトサイズ以下ならそのまま
        }
        
        // 長いコンテンツの場合は適切なサイズに分割
        return self::DEFAULT_CHUNK_SIZE;
    }

    /**
     * コンテンツを適切なサイズに分割
     */
    private function splitContent(string $content, int $chunkSize): array
    {
        if (strlen($content) <= $chunkSize) {
            return [$content];
        }

        $chunks = [];
        $sentences = $this->splitIntoSentences($content);
        $currentChunk = '';
        $currentSize = 0;

        foreach ($sentences as $sentence) {
            $sentenceLength = strlen($sentence);
            
            // 現在のチャンクに追加するとサイズを超える場合
            if ($currentSize + $sentenceLength > $chunkSize && !empty($currentChunk)) {
                $chunks[] = trim($currentChunk);
                $currentChunk = $sentence;
                $currentSize = $sentenceLength;
            } else {
                $currentChunk .= ' ' . $sentence;
                $currentSize += $sentenceLength;
            }
        }

        // 最後のチャンクを追加
        if (!empty(trim($currentChunk))) {
            $chunks[] = trim($currentChunk);
        }

        return $chunks;
    }

    /**
     * 文章をセンテンスに分割
     */
    private function splitIntoSentences(string $text): array
    {
        // 句読点で分割（日本語対応）
        $sentences = preg_split('/[。！？\.\!\?]+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        
        // 空の要素を除去し、トリム
        return array_map('trim', array_filter($sentences));
    }

    /**
     * トークン数を推定
     */
    private function estimateTokenCount(string $text): int
    {
        // 簡易的な推定（日本語は1文字≈1トークン、英語は1単語≈1.3トークン）
        $japaneseChars = preg_match_all('/[\p{Hiragana}\p{Katakana}\p{Han}]/u', $text);
        $englishWords = str_word_count($text, 0, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
        
        return $japaneseChars + intval($englishWords * 1.3) + 10; // オーバーヘッドを考慮
    }

    /**
     * 重複チャンクを除去
     */
    private function removeDuplicateChunks(array $chunks): array
    {
        $uniqueChunks = [];
        
        foreach ($chunks as $chunk) {
            $isDuplicate = false;
            
            foreach ($uniqueChunks as $existingChunk) {
                if ($this->calculateSimilarity($chunk['content'], $existingChunk['content']) > self::SIMILARITY_THRESHOLD) {
                    $isDuplicate = true;
                    break;
                }
            }
            
            if (!$isDuplicate) {
                $uniqueChunks[] = $chunk;
            }
        }
        
        return $uniqueChunks;
    }

    /**
     * 類似度を計算（簡易版）
     */
    private function calculateSimilarity(string $text1, string $text2): float
    {
        // 簡易的な類似度計算（実際の実装ではより高度なアルゴリズムを使用）
        $words1 = str_word_count($text1, 1);
        $words2 = str_word_count($text2, 1);
        
        $intersection = array_intersect($words1, $words2);
        $union = array_unique(array_merge($words1, $words2));
        
        return count($intersection) / max(count($union), 1);
    }

    /**
     * チャンクをデータベースに保存
     */
    private function saveChunks(Document $document, array $chunks): void
    {
        // 既存のチャンクを削除
        DocumentChunk::where('document_id', $document->id)->delete();
        
        // バッチで挿入
        $batchSize = 100;
        $batches = array_chunk($chunks, $batchSize);
        
        foreach ($batches as $batch) {
            DocumentChunk::insert($batch);
        }

        Log::info("Chunks saved to database", [
            'document_id' => $document->id,
            'chunk_count' => count($chunks)
        ]);
    }

    /**
     * チャンクの分布統計を取得
     */
    public function getChunkDistribution(Document $document): array
    {
        $chunks = DocumentChunk::where('document_id', $document->id)->get();
        
        if ($chunks->isEmpty()) {
            return [
                'total_chunks' => 0,
                'avg_size' => 0,
                'size_distribution' => []
            ];
        }

        $sizes = $chunks->pluck('word_count')->toArray();
        
        return [
            'total_chunks' => $chunks->count(),
            'avg_size' => round(array_sum($sizes) / count($sizes), 2),
            'min_size' => min($sizes),
            'max_size' => max($sizes),
            'size_distribution' => [
                '500-1000' => count(array_filter($sizes, fn($size) => $size >= 500 && $size <= 1000)),
                '200-500' => count(array_filter($sizes, fn($size) => $size >= 200 && $size < 500)),
                '1000+' => count(array_filter($sizes, fn($size) => $size > 1000))
            ]
        ];
    }

    /**
     * ドキュメントの版管理と重複検出
     */
    public function detectVersionAndDuplicates(Document $document): array
    {
        // 同じタイトルのドキュメントを検索
        $existingDocuments = Document::where('title', $document->title)
            ->where('user_id', $document->user_id)
            ->where('id', '!=', $document->id)
            ->where('status', '!=', Document::STATUS_INACTIVE)
            ->get();

        $duplicates = [];
        $latestVersion = 0;

        foreach ($existingDocuments as $existing) {
            if ($existing->version > $latestVersion) {
                $latestVersion = $existing->version;
            }
            
            // 簡易的な重複検出（ファイルサイズとファイル名で判定）
            if ($existing->file_size === $document->file_size && 
                $existing->original_filename === $document->original_filename) {
                $duplicates[] = $existing;
            }
        }

        return [
            'latest_version' => $latestVersion,
            'duplicates' => $duplicates,
            'is_duplicate' => !empty($duplicates)
        ];
    }
}
