<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('document_chunks', function (Blueprint $table) {
            // pgvector拡張を有効化（PostgreSQLの場合）
            DB::statement('CREATE EXTENSION IF NOT EXISTS vector');
            
            // 埋め込みベクトル用のカラムを追加
            $table->json('embedding_vector')->nullable()->comment('pgvector用の埋め込みベクトル');
            
            // ベクトル検索用のインデックスを追加
            DB::statement('CREATE INDEX IF NOT EXISTS document_chunks_embedding_vector_idx ON document_chunks USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_chunks', function (Blueprint $table) {
            // インデックスを削除
            DB::statement('DROP INDEX IF EXISTS document_chunks_embedding_vector_idx');
            
            // カラムを削除
            $table->dropColumn('embedding_vector');
        });
    }
};
