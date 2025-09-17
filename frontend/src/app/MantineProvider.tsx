"use client";
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css'; // Mantineのスタイルをインポート

// オプション: カスタムテーマの設定
const theme = createTheme({
  // カスタム設定があれば追加
});

export default function AppMantineProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <MantineProvider theme={theme}>
      {children}
    </MantineProvider>
  );
}