plugin for Chart.js

## how to use ##
add lines to html file
```
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.5.0/Chart.min.js"></script>
    <script text="text/javascript" src="/chartjs-plugin-cursor.js" ></script>
```
## try example ##
```
    cd example
    npm install
    node ./index.js
```

## properties ##
|name|description|
|:---|:---|
|enabled| true: Chartをnewするときに初期化する<br>false: このプラグインを使わない|
|display| true: カーソルを表示する  <br> false: カーソルを非表示にする|

## method ##
|name|return|argument|description|
|:---|:---|:---|:---|
|getSelectedValue|{left, right}<br>left: xの小さい側の値<br>right: xの大きい側の値|なし|現在のカーソルで選択されている範囲の左端と右端のxの値を返す。pixel値ではないことに注意|
|setSelectedValue|なし|(cursor_type, value)<br>cursor_type: 'dash','solid'<br>value: xの値を指定|valueで指定されたxの値のところにカーソルを移動させる（未テスト）|