export default function About() {
  return (
    <div className="min-h-screen bg-amber-50">
      {/* ヘッダー */}
      <header className="bg-amber-800 text-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href="/" className="text-amber-300 text-sm">← 地図に戻る</a>
          <h1 className="text-lg font-bold">🥐 ゴパンについて</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* アプリについて */}
        <section>
          <h2 className="text-lg font-bold text-amber-900 border-b border-amber-200 pb-2 mb-3">
            ゴパンとは
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            「ゴパン」は、全国のパン屋を地図で見つけるWebアプリです。現在地周辺のパン屋をすぐに発見でき、気になるお店をブックマークできます。
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mt-2">
            名前の由来は「ご飯＋パン＝ゴパン」。「朝ゴパン買って帰ろう」という日常の言葉から生まれました。
          </p>
        </section>

        {/* ご注意 */}
        <section>
          <h2 className="text-lg font-bold text-amber-900 border-b border-amber-200 pb-2 mb-3">
            ⚠️ ご注意
          </h2>
          <div className="bg-amber-100 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-bold text-amber-900">⭐ お気に入り・♥ 気になるについて</p>
              <p className="text-sm text-gray-700 mt-1">
                お気に入りと気になるの登録は、<strong>この端末のブラウザにのみ保存</strong>されます。ブラウザのキャッシュやデータを削除した場合、登録内容が消える場合があります。あらかじめご了承ください。
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">📍 位置情報について</p>
              <p className="text-sm text-gray-700 mt-1">
                現在地の取得はお使いのデバイスのGPS機能を使用します。位置情報の利用許可をブラウザから求められた場合、許可することで現在地周辺のパン屋を表示できます。
              </p>
            </div>
          </div>
        </section>

        {/* 免責事項 */}
        <section>
          <h2 className="text-lg font-bold text-amber-900 border-b border-amber-200 pb-2 mb-3">
            免責事項
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            本アプリのパン屋情報はOpenStreetMapのデータを使用しており、情報が古い・不正確・閉店済みな場合があります。掲載情報の正確性・完全性を保証するものではありません。
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mt-2">
            本アプリの利用により生じたいかなる損害についても、開発者は責任を負いかねます。
          </p>
        </section>

        {/* プライバシーポリシー */}
        <section>
          <h2 className="text-lg font-bold text-amber-900 border-b border-amber-200 pb-2 mb-3">
            プライバシーポリシー
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-bold text-amber-900">収集する情報</p>
              <p className="mt-1">本アプリは以下の情報を収集する場合があります：</p>
              <ul className="mt-1 ml-4 space-y-1 list-disc">
                <li>位置情報（現在地表示のため、端末上でのみ使用）</li>
                <li>アクセスログ（Vercelのサーバーログ）</li>
                <li>広告配信のためのCookie（Google AdSense使用時）</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-amber-900">広告について</p>
              <p className="mt-1">
                本アプリではGoogle AdSenseを利用した広告を掲載する場合があります。Googleは広告配信にCookieを使用することがあります。詳細は
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline ml-1">
                  Googleのプライバシーポリシー
                </a>
                をご確認ください。
              </p>
            </div>
            <div>
              <p className="font-bold text-amber-900">第三者サービス</p>
              <ul className="mt-1 ml-4 space-y-1 list-disc">
                <li>
                  <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline">OpenStreetMap</a>
                  （地図データ・パン屋情報）
                </li>
                <li>
                  <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline">Supabase</a>
                  （データベース）
                </li>
                <li>
                  <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline">Vercel</a>
                  （ホスティング）
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* データの出典 */}
        <section>
          <h2 className="text-lg font-bold text-amber-900 border-b border-amber-200 pb-2 mb-3">
            データの出典
          </h2>
          <p className="text-sm text-gray-700">
            パン屋の位置情報は
            <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline mx-1">
              OpenStreetMap
            </a>
            のデータを使用しています（© OpenStreetMap contributors, ODbLライセンス）。
          </p>
        </section>

        {/* お問い合わせ */}
        <section>
          <h2 className="text-lg font-bold text-amber-900 border-b border-amber-200 pb-2 mb-3">
            お問い合わせ
          </h2>
          <p className="text-sm text-gray-700">
            ご意見・ご要望・パン屋情報の誤りなどは、OpenStreetMapの編集機能からご報告いただくか、下記までご連絡ください。
          </p>
          <p className="text-sm text-amber-700 mt-2">
            ※ お問い合わせフォームは準備中です。
          </p>
        </section>

        {/* 開発者情報 */}
        <section className="pb-8">
          <h2 className="text-lg font-bold text-amber-900 border-b border-amber-200 pb-2 mb-3">
            開発者
          </h2>
          <p className="text-sm text-gray-700">mods240</p>
          <p className="text-xs text-gray-400 mt-4 text-center">
            🥐 ゴパン v1.0 | © 2026 mods240
          </p>
        </section>
      </div>
    </div>
  );
}
