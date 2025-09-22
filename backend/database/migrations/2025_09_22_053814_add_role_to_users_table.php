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
        Schema::table('users', function (Blueprint $table) {
            // roleカラムがまた存在しない場合のみ追加
            if(!Schema::hasColumn('users','role')){
                $table->string('role')->default('customer');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //roleカラムが追加する場合のみ削除
            if(Schema::hasColumn('users','role')){
                $table->string('role');
            }
        });
    }
};
