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
            「ゴパン」は、全国のパン屋を地図で見つけるWebアプリです。現在地周辺のパン屋をすぐに発見でき、気になるお店をブックマークしたり、同乗者とリアルタイムで共有できます。
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mt-2">
            名前の由来は「ご飯＋パン＝ゴパン」。「朝ゴパン買って帰ろう」という日常の言葉から生まれました。
          </p>
        </section>

        {/* 使い方 */}
        <section>
          <h2 className="text-lg font-bold text-amber-900 border-b border-amber-200 pb-2 mb-3">
            📖 使い方
          </h2>
          <div className="space-y-4">

            {/* 基本 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
              <p className="font-bold text-amber-900 text-sm mb-2">🗺️ 地図でパン屋を探す</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                アプリを開くと現在地周辺のパン屋が地図に表示されます。🥐アイコンをタップするとお店の名前・住所・Google Mapsへのリンクが表示されます。エリアは右上のヘッダーをタップしていつでも変更できます。
              </p>
            </div>

            {/* リスト */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
              <p className="font-bold text-amber-900 text-sm mb-2">📋 リストで探す・検索する</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                「リスト」タブでは現在地から近い順にパン屋が一覧表示されます。店舗名や住所でキーワード検索も可能です。店舗名をタップすると地図タブに切り替わり、そのお店の場所にズームします。
              </p>
            </div>

            {/* 気になる・お気に入り */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
              <p className="font-bold text-amber-900 text-sm mb-2">♥ 気になる　⭐ お気に入り</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                気になるお店は <strong>♥(赤丸ボタン)</strong> で「気になる」登録、<strong>⭐</strong> で「お気に入り」登録できます。登録したお店はリストや地図で色分けして表示されます。「⭐ タブ」でお気に入り一覧も確認できます。
              </p>
            </div>

            {/* 近接アラート */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
              <p className="font-bold text-amber-900 text-sm mb-2">🔔 近接アラート</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                「気になる」または「お気に入り」に登録したお店の<strong>500m以内</strong>に近づくと、画面上部に赤いバナーでお知らせします。タップすると地図でそのお店にジャンプします。アラートは同じお店に対して<strong>3分に1回</strong>表示されます。
              </p>
            </div>

            {/* ペアリング */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 border-l-4 border-l-amber-500">
              <p className="font-bold text-amber-900 text-sm mb-2">🔗 ペアリング機能(同乗者と共有)</p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                助手席の人が見つけたパン屋を運転手にリアルタイムで送れる機能です。家族やカップルのドライブで活躍します。
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex gap-2">
                  <span className="bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 text-xs font-bold shrink-0">送る側</span>
                  <p>🔗タブ → 「ルームを作成する」→ 表示された6桁コードを相手に伝える → リストや地図ピンの 📤 ボタンでパン屋を送信</p>
                </div>
                <div className="flex gap-2">
                  <span className="bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 text-xs font-bold shrink-0">受け取る側</span>
                  <p>🔗タブ → コードを入力して「参加する」→ パン屋が送られてくるとオレンジのバナーが表示 → タップで地図にジャンプ</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                💡 ペアリングはブラウザを閉じても記憶されます。普段からペアリングしておけば、LINEで「ここどう？」と送る前にアプリから直接共有できます。
              </p>
            </div>

            {/* LINE・X共有 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
              <p className="font-bold text-amber-900 text-sm mb-2">📤 LINE・Xで共有</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                リストの各店舗にある <strong className="text-green-600">L</strong> ボタンでLINEに、<strong>X</strong> ボタンでX(旧Twitter)にお店の情報をシェアできます。地図ピンのポップアップからも共有できます。
              </p>
            </div>

            {/* PWA */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
              <p className="font-bold text-amber-900 text-sm mb-2">📱 ホーム画面に追加(PWA)</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                iPhoneはSafariの「共有」→「ホーム画面に追加」、AndroidはChromeのメニューから「ホーム画面に追加」でアプリのように使えます。
              </p>
            </div>

          </div>
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
                現在地の取得はお使いのデバイスのGPS機能を使用します。位置情報の利用許可をブラウザから求められた場合、許可することで現在地周辺のパン屋を表示できます。位置情報はサーバーに送信されません。
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">🔗 ペアリングのデータについて</p>
              <p className="text-sm text-gray-700 mt-1">
                ペアリングで送受信されるパン屋情報はSupabaseのデータベースに一時保存されます。ルームコードを知らない第三者はアクセスできません。
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
                <li>位置情報（現在地表示のため、端末上でのみ使用・サーバー送信なし）</li>
                <li>アクセスログ（Vercelのサーバーログ）</li>
                <li>広告配信のためのCookie（Google AdSense使用時）</li>
                <li>ペアリングで送受信したパン屋情報（Supabaseに一時保存）</li>
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
                  （データベース・ペアリング機能）
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

        {/* フッター */}
        <section className="pb-8">
          <p className="text-xs text-gray-400 text-center">
            🥐 ゴパン v2.0 | © 2026
          </p>
        </section>

      </div>
    </div>
  );
}