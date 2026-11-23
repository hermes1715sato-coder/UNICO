/* 配色バリエーション定義 (サーバー/クライアント共用) */
export const THEMES = [
  { id: "silver", name: "Premium Silver", ja: "現行：ホワイト×マットシルバー", sw: ["#f5f6f3", "#ffffff", "#c3cbca", "#2b3431", "#b5a078"] },
  { id: "carbon", name: "Carbon Night", ja: "新ロゴに合わせたダーク", sw: ["#0d0f10", "#15181a", "#3b4447", "#eef1f0", "#c6b28a"] },
  { id: "champagne", name: "Ivory Champagne", ja: "アイボリー×シャンパンゴールド", sw: ["#f6f3ec", "#fffdf9", "#d4c8b1", "#3a332a", "#b39259"] },
  { id: "navy", name: "Midnight Navy", ja: "ホワイト×ミッドナイトネイビー", sw: ["#f3f5f8", "#ffffff", "#c0c9d5", "#1d2c47", "#b39c6e"] },
  { id: "forest", name: "Forest Accent", ja: "ホワイト×濃緑アクセント", sw: ["#f4f6f3", "#ffffff", "#bfccc5", "#173a2f", "#b5a078"] },
  { id: "crimson", name: "Jockey Crimson", ja: "勝負服の深紅", sw: ["#f7f5f4", "#ffffff", "#d3c7c6", "#8e1b2c", "#b5a078"] },
  { id: "royal", name: "Royal Purple", ja: "G1の格式・紫×金", sw: ["#f6f5f9", "#ffffff", "#cbc5da", "#3b2766", "#b8995a"] },
  { id: "sakura", name: "Sakura", ja: "春のクラシック・桜×ローズゴールド", sw: ["#fbf6f7", "#fffdfd", "#e0c9cf", "#a94a66", "#c49a8a"] },
  { id: "glacier", name: "Glacier", ja: "冬の朝の氷青", sw: ["#f2f7fa", "#ffffff", "#b8cfdd", "#1f6a8f", "#b0a07f"] },
  { id: "sunset", name: "Sunset Paddock", ja: "夕暮れのパドック・テラコッタ", sw: ["#f8f3ee", "#fffcf9", "#dbc3ae", "#a8462a", "#c08a4a"] },
  { id: "nighter", name: "Nighter", ja: "ナイター競馬・夜×照明のシアン", sw: ["#070b14", "#0e1422", "#2e3c58", "#0b7a99", "#e3c36f"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export const THEME_KEY = "unico-theme";

/** 初回描画前に適用するインラインスクリプト (ちらつき防止) */
export const THEME_INIT_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search).get('theme');var ids=${JSON.stringify(
  THEMES.map((t) => t.id),
)};var t=(q&&ids.indexOf(q)>=0)?q:localStorage.getItem('${THEME_KEY}');if(q&&ids.indexOf(q)>=0)localStorage.setItem('${THEME_KEY}',q);if(t&&t!=='silver'&&ids.indexOf(t)>=0)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
