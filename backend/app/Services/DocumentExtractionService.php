<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\Html;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use PhpOffice\PhpSpreadsheet\Reader\Xls;
use PhpOffice\PhpSpreadsheet\Reader\Csv;
use PhpOffice\PhpSpreadsheet\Reader\Ods;
use PhpOffice\PhpSpreadsheet\Reader\Slk;
use PhpOffice\PhpSpreadsheet\Reader\Xml;
use PhpOffice\PhpSpreadsheet\Reader\Gnumeric;
use PhpOffice\PhpSpreadsheet\Reader\Ods as OdsReader;
use PhpOffice\PhpSpreadsheet\Shared\File;
use Illuminate\Support\Facades\Log;
use Exception;

class DocumentExtractionService
{
    // 対応ファイル形式
    const SUPPORTED_EXTENSIONS = [
        'xlsx', 'xls', 'csv', 'ods', 'slk', 'xml', 'gnumeric', 'html'
    ];

    // 最大ファイルサイズ（50MB）
    const MAX_FILE_SIZE = 50 * 1024 * 1024;

    /**
     * ドキュメントを抽出・構造化
     */
    public function extractDocument(string $filePath, string $originalFilename): array
    {
        try {
            $this->validateFile($filePath, $originalFilename);
            
            $extension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
            $reader = $this->getReader($extension);
            
            if (!$reader) {
                throw new Exception("Unsupported file format: {$extension}");
            }

            $spreadsheet = $reader->load($filePath);
            $extractedData = $this->extractStructuredData($spreadsheet, $originalFilename);
            
            Log::info("Document extraction completed", [
                'filename' => $originalFilename,
                'sheets_count' => count($extractedData['sheets']),
                'total_chunks' => array_sum(array_map(fn($sheet) => count($sheet['chunks']), $extractedData['sheets']))
            ]);

            return $extractedData;

        } catch (Exception $e) {
            Log::error("Document extraction failed", [
                'filename' => $originalFilename,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw new Exception("Document extraction failed: " . $e->getMessage());
        }
    }

    /**
     * ファイルの検証
     */
    private function validateFile(string $filePath, string $filename): void
    {
        if (!file_exists($filePath)) {
            throw new Exception("File not found: {$filePath}");
        }

        $fileSize = filesize($filePath);
        if ($fileSize > self::MAX_FILE_SIZE) {
            throw new Exception("File size exceeds limit: " . number_format($fileSize / 1024 / 1024, 2) . "MB");
        }

        if ($fileSize === 0) {
            throw new Exception("File is empty");
        }

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if (!in_array($extension, self::SUPPORTED_EXTENSIONS)) {
            throw new Exception("Unsupported file extension: {$extension}");
        }
    }

    /**
     * ファイル拡張子に応じたリーダーを取得
     */
    private function getReader(string $extension): ?object
    {
        try {
            switch ($extension) {
                case 'xlsx':
                    return new Xlsx();
                case 'xls':
                    return new Xls();
                case 'csv':
                    return new Csv();
                case 'ods':
                    return new OdsReader();
                case 'slk':
                    return new Slk();
                case 'xml':
                    return new Xml();
                case 'gnumeric':
                    return new Gnumeric();
                case 'html':
                    return new Html();
                default:
                    return null;
            }
        } catch (Exception $e) {
            Log::error("Failed to create reader", [
                'extension' => $extension,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * 構造化データを抽出
     */
    private function extractStructuredData($spreadsheet, string $filename): array
    {
        $result = [
            'filename' => $filename,
            'sheets' => [],
            'metadata' => [
                'total_sheets' => $spreadsheet->getSheetCount(),
                'extraction_timestamp' => now()->toISOString(),
                'file_type' => pathinfo($filename, PATHINFO_EXTENSION)
            ]
        ];

        foreach ($spreadsheet->getAllSheets() as $sheetIndex => $sheet) {
            $sheetData = $this->extractSheetData($sheet, $sheetIndex);
            $result['sheets'][] = $sheetData;
        }

        return $result;
    }

    /**
     * シートデータを抽出
     */
    private function extractSheetData($sheet, int $sheetIndex): array
    {
        $sheetName = $sheet->getTitle();
        $chunks = [];
        $currentSection = null;
        $chunkIndex = 0;

        // 最大行・列を取得
        $highestRow = $sheet->getHighestDataRow();
        $highestColumn = $sheet->getHighestDataColumn();

        // 行ごとに処理
        for ($row = 1; $row <= $highestRow; $row++) {
            $rowData = [];
            $hasData = false;

            // 列ごとにデータを取得
            for ($col = 'A'; $col <= $highestColumn; $col++) {
                $cellValue = $sheet->getCell($col . $row)->getCalculatedValue();
                if ($cellValue !== null && $cellValue !== '') {
                    $rowData[$col] = (string) $cellValue;
                    $hasData = true;
                }
            }

            if (!$hasData) {
                continue;
            }

            // セルの結合やスタイルを考慮してコンテンツタイプを判定
            $contentType = $this->determineContentType($sheet, $row, $rowData);
            $content = $this->formatRowContent($rowData);

            // セクションタイトルを判定（太字や大きなフォントサイズなど）
            $sectionTitle = $this->extractSectionTitle($sheet, $row, $content, $contentType);

            if ($sectionTitle && $sectionTitle !== $currentSection) {
                $currentSection = $sectionTitle;
            }

            if (!empty(trim($content))) {
                $chunks[] = [
                    'chunk_index' => $chunkIndex++,
                    'content' => $content,
                    'content_type' => $contentType,
                    'section_title' => $currentSection,
                    'metadata' => [
                        'row' => $row,
                        'columns' => array_keys($rowData),
                        'sheet_index' => $sheetIndex
                    ]
                ];
            }
        }

        return [
            'sheet_name' => $sheetName,
            'sheet_index' => $sheetIndex,
            'chunks' => $chunks,
            'metadata' => [
                'total_rows' => $highestRow,
                'total_columns' => $highestColumn,
                'chunk_count' => count($chunks)
            ]
        ];
    }

    /**
     * コンテンツタイプを判定
     */
    private function determineContentType($sheet, int $row, array $rowData): string
    {
        // 最初の行やセルが太字の場合は見出しとして扱う
        if ($row === 1) {
            return 'heading';
        }

        // セルの値が数値のみの場合は表データとして扱う
        $numericCount = 0;
        foreach ($rowData as $value) {
            if (is_numeric($value)) {
                $numericCount++;
            }
        }

        if ($numericCount > count($rowData) / 2) {
            return 'table';
        }

        // デフォルトは段落として扱う
        return 'paragraph';
    }

    /**
     * 行のコンテンツをフォーマット
     */
    private function formatRowContent(array $rowData): string
    {
        $content = [];
        foreach ($rowData as $value) {
            $content[] = trim($value);
        }

        return implode(' | ', array_filter($content));
    }

    /**
     * セクションタイトルを抽出
     */
    private function extractSectionTitle($sheet, int $row, string $content, string $contentType): ?string
    {
        // 見出しタイプの場合、セクションタイトルとして扱う
        if ($contentType === 'heading' && !empty(trim($content))) {
            return trim($content);
        }

        // 短いテキストで、行番号が小さい場合はセクションタイトルとして扱う
        if (strlen($content) < 50 && $row <= 5 && !empty(trim($content))) {
            return trim($content);
        }

        return null;
    }

    /**
     * 抽出成功率を計算（テスト用）
     */
    public function calculateExtractionSuccessRate(array $testFiles): float
    {
        $successCount = 0;
        $totalCount = count($testFiles);

        foreach ($testFiles as $filePath) {
            try {
                $this->extractDocument($filePath, basename($filePath));
                $successCount++;
            } catch (Exception $e) {
                Log::warning("Test extraction failed", [
                    'file' => basename($filePath),
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $totalCount > 0 ? ($successCount / $totalCount) * 100 : 0;
    }
}
