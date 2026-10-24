# Harmonic Keyboard — GitHub Pages公開用

2026-10-23作成。v3.1の公開用一式です。ZIPを展開して使ってください。GitHubへのアップロード・一般公開はまだ行っていません。

## 今回の変更

- 純正律の誤差表示を正式機能として初期ONに変更。参考limitの薄い点線と、誤差の明るい短点線を区別します。
- 鍵盤を50〜200%、10%刻みで拡縮可能。両モード、編集、集中表示でも利用できます。

- モードバーで12・19・24・31・41・53 EDOを選択可能。倍音列・三和音合成・種和音編集に対応。各モードのEDOは個別に保持します。
- プリセット形は元の純正比から再計算。カスタム形、根音配置、主音、導音幅は最も近い段に変換します。丸めのため往復は完全可逆ではありません。音が同じ段に重なる場合は切替を拒否して知らせます。
- 切替時に新しい合成音階を適用します。通常の押下音は離すまで元の周波数を維持し、予約した試奏は取り消します。編集中の未登録変更は従来の確認画面で保護します。
- 保存schemaVersion=2。旧31 EDO/schemaVersion=1を読み込めます。端末保存はv3へ移行し、v2の元データを残します。v3 JSONを旧アプリでは読み込めません。

既にGitHub Pagesで公開している場合は、このZIPのdocsフォルダの内容をリポジトリのdocsへ上書きしてコミットしてください。再編集用のsourceも一緒に更新してください。URLやPages設定は変える必要はありません。

- 初期マスター音量は50%。端末側の音量とは独立しています。
- 「純正律との差」は正式機能として初期ON。表示ボタンでOFFにもできます。許容誤差内の太いlimit帯にだけ誤差の点線を表示します。遠い参考候補の帯には誤差点線を表示しません。
- 鍵盤、音源、三和音合成、共通の種和音、解析、保存、集中表示、縦横スクロールは維持しています。

## 中身

- `docs/`：ビルド済みの公開用ファイル。このフォルダをPagesの公開対象にします。
- `docs/index.html`：アプリ本体。React・JavaScript・CSS・解析Workerを内包しています。
- `docs/offline.html`：アプリ内のダウンロード用。index.htmlと同じ内容です。
- `docs/.nojekyll`：Jekyll変換を無効化する空ファイル。
- `source/`：TypeScript/Reactソース、テスト、ビルド設定、依存バージョン固定ファイル。
- `DEPENDENCIES.md`：実行時・開発時・任意依存を含む全ライブラリ一覧。
- `THIRD_PARTY_NOTICES.txt`：使用ライブラリのライセンス本文。公開物にも同梱しています。
- `SECURITY_REVIEW.md`：今回の確認結果と限界。
- `SHA256SUMS.txt`：同梱ファイルのチェックサム。

## 最短の公開手順（ビルド不要）

1. GitHubにログインして、新しいPublicリポジトリを作ります。例：`harmonic-keyboard`。
2. このZIPを展開し、中の `docs`、`source`、README等をリポジトリのルートへアップロードします。ZIPファイル自体や、その外側のフォルダをアップロードするだけでは動作しません。`docs/index.html`がリポジトリ直下のdocs内にあることを確認してください。
3. `docs/.nojekyll`が隠しファイル扱いでアップロードされなかった場合は、GitHubの「Add file → Create new file」で `docs/.nojekyll`を作成してください（内容は空で構いません）。
4. リポジトリの「Settings → Pages → Build and deployment」を開き、Sourceを「Deploy from a branch」にします。
5. Branchを `main`、フォルダを `/docs` にしてSaveします。
6. 公開処理が成功したら、Pages画面に表示されたURLを開きます。通常は `https://ユーザー名.github.io/harmonic-keyboard/` です。独自ドメインは不要です。
7. 「Enforce HTTPS」を確認します。更新が見えないときは再読み込みし、Actionsの公開結果も確認してください。

GitHubの画面からアップロードする場合も、ソースやnode_modulesをビルドする操作は不要です。ソースを公開したくない場合は、docsフォルダと第三者ライセンスだけでもサイトは動作します。ただしブラウザへ配るJavaScript自体は誰でも閲覧できます。

公式手順（確認日：2026-10-23）:
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https

## ソースを変更して再ビルドする場合

TypeScript/Reactのソースはビルドが必要です。公開用docsはすでにビルド済みです。
開発用PCにNode.js 22.18以降または24系とnpmを用意してください（TypeScriptテストの実行にNodeの型除去機能を使用）。ZIPを展開したフォルダで、以下を順に実行します。

```sh
cd source
npm ci
npx tsc --noEmit
npm test
npm run build
node export-pages.mjs
```

`npm ci`はnpmレジストリから固定された依存関係を取得します。esbuildのインストール処理も実行されます。以後は依存変更がなければインストール不要です。`npm run build`はsource/distに静的HTMLを生成し、`node export-pages.mjs`はそれを公開用docsにコピーします。更新後のdocsをGitHubへコミットするとPagesに反映されます。チェックサムはこのZIP作成時のものなので、ソースを変更すると一致しなくなります。

ローカル確認には展開フォルダで `python -m http.server 8000` を実行し、`http://localhost:8000/docs/` を開けます。ファイルを直接開くfile://では、保存・ダウンロード・Worker等のブラウザ制約が異なるため、公開前はHTTP/HTTPSで確認してください。

## サブディレクトリ・通信・データ

JavaScript/CSS/WorkerをHTML内へ埋め込んでおり、外部CDN・フォント・音源の読み込みはありません。ダウンロード先は相対パス `offline.html`。ルート絶対パスや元のホスティング先に依存しないため、`/リポジトリ名/`や任意のサブディレクトリで動作する構成です。Workerは同じHTMLに含まれるコードからBlob URLを生成します。PHP・データベース・バックエンドAPI・APIキーは不要です。

音階設定は各ブラウザのlocalStorageへ保存します。アプリが設定や演奏を外部へ送信するコードは確認されていません。GitHubへのページ取得通信とGitHub側のアクセスログは別です。保存内容はクラウド同期されず、別端末や別ドメインへはJSONを書き出して移してください。同じgithub.ioのオリジンに置いた別サイトとはlocalStorageが共有されるため、秘密情報を保存しないでください。

## PC・iPad・スマートフォン

Web Audio API、Pointer Events、Web Workerに対応したブラウザを想定。PCのChrome/Edge、iPadのSafari、AndroidのChromeを対象にしたレスポンシブ構成です。音声は最初の鍵盤操作/試奏で有効になります。無操作の自動再生はブラウザ制約でできません。鍵盤上は演奏操作を優先するため、縦スクロールは鍵盤以外の余白やモニターから行ってください。集中表示の「鍵盤・モニターへ」も利用できます。

このZIPの実機でのブラウザ音声・マルチタッチ・画面表示は未検証です。公開後は各端末で、3音同時押し、指を離す、停止、画面切替、編集登録、誤差表示切替、保存/読み込み、スクロールを確認してください。

## セキュリティ上の注意

コード・公開ファイルを確認し、認証情報やアプリ固有の外部通信は検出していません。npm auditでも確認時点の報告は0件でした。ただし、コード確認と既知の脆弱性照会だけでは安全性を保証できません。未知の脆弱性、ブラウザ/OS、依存ライブラリ、ホスティングやアカウントの侵害は検証対象外です。詳細はSECURITY_REVIEW.mdを参照してください。

Publicリポジトリと公開ファイルには、APIキー、パスワード、個人情報、私的な保存JSON、.env、秘密鍵を追加しないでください。GitHubアカウントの2要素認証、依存関係の定期的な監査、信頼できるコード変更のレビューを行ってください。第三者スクリプトや分析ツールを追加した場合は通信・プライバシー条件が変わります。独自CSPを追加する場合は、インラインJS/CSSとBlob Workerの利用を考慮して動作確認してください。
