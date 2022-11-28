let all;
let unit = [];
let chapter = [];
let section = [];
let problem = [];
let unitIndex = 0;
let chapIndex = 0;
let sectIndex = 0;
let upBorder = 101;
let downBorder = -1;
let isHeatmap = false;
let isHundred = false;
let schedule = [
  ["午前免除(12月)", new Date(2022, 12 - 1, 11, 9, 30, 0)],
  ["午前免除(1月)", new Date(2023, 1 - 1, 22, 9, 30, 0)],
]
let oldYear = 1994;
let newYear = 2019;
let upYear = 2021;
let downYear = 2017;
let problemList = [];
// let startTime = 0;
// let endTime = 0;

// 現在時刻の取得・カウントダウン
let countdown = setInterval(() => {
  let currentTime = new Date();

  for (let i = 0; i < schedule.length; i++) {
    let targetTime = schedule[i][1];
    let remainTime = targetTime - currentTime;
    if (remainTime < 0) remainTime = 0;

    //差分の日・時・分・秒を取得
    let diffDay = Math.floor(remainTime / 1000 / 60 / 60 / 24);
    let diffHour = Math.floor(remainTime / 1000 / 60 / 60) % 24;
    let diffMin = Math.floor(remainTime / 1000 / 60) % 60;
    let diffSec = Math.floor(remainTime / 1000) % 60;

    //残りの日時を上書き
    document.getElementById(`day${i + 1}`).innerHTML = diffDay;
    document.getElementById(`hour${i + 1}`).innerHTML = diffHour;
    document.getElementById(`min${i + 1}`).innerHTML = diffMin;
    document.getElementById(`sec${i + 1}`).innerHTML = diffSec;
  }
}, 1000)    //1秒間に1度処理

// ボーダーカラー表示が有効ならオプションを表示する
let isBorder = () => {
  if (document.getElementById("border").checked) {
    document.getElementById("settingBorder").style.display = "block";
  } else {
    document.getElementById("settingBorder").style.display = "none";
  }
}

// ファイル読み込みの設定
let fileInput = document.getElementById("csv_file");
let message = document.getElementById("message");
let fileReader = new FileReader();
let file;

// ファイル読み込み時
fileInput.onchange = () => {
  file = fileInput.files[0];
  fileReader.readAsText(file, "Shift_JIS");
}

// ファイル読み込み成功時
fileReader.onload = () => {
  // startTime = performance.now();

  document.getElementById("option").style.display = "none";
  document.getElementById("news").style.display = "none";

  if ((file.name.match(/.csv$/)) === null) {
    message.innerHTML = "不正なファイル形式です。ファイル形式を確認して再度アップロードしてください。";
    document.getElementById("message").style.color = "#f00";
  } else {
    message.innerHTML = "読み込みに成功しました！";
    document.getElementById("menu").style.display = "block";
    changeMode("data");
    makeSelectOption();

    if (document.getElementById("border").checked) {
      upBorder = Number(document.getElementById("red").value);
      downBorder = Number(document.getElementById("blue").value);
    }

    if (document.getElementById("heatmap").checked) isHeatmap = true;
    if (document.getElementById("hundred").checked) isHundred = true;

    all = makeObject(all, false);
    let result = fileReader.result;
    result = specialCharacter(result);
    splitToLine(result);

    // endTime = performance.now();
    // console.log(endTime - startTime);
    setTimeout(() => {
      generateSettingTable(-1, -1, -1);
      generateTable();
    }, 500);
  }
}

// ファイル読み込み失敗時
fileReader.onerror = () => {
  message.innerHTML = "ファイル読み込みに失敗しました。ブラウザを更新してから再度お試しください。";
  document.getElementById("message").style.color = "#f00";
}

let specialCharacter = s => {
  let t = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] == '&') t += "&amp;";
    else if (s[i] == '<') t += "&lt;";
    else if (s[i] == '>') t += "&gt;";
    else if (s[i] == '"') t += "&quot;";
    else if (s[i] == "'") t += "$#39;";
    else t += s[i];
  }

  return t;
}

// 行単位に分割
let splitToLine = s => {
  let line = s.split("\r\n");
  let del = true;
  while (del) {
    if (line[line.length - 1][0] == 'E') del = false;
    line.pop();
  }
  splitToCeil(line);
}

// セル単位に分割
let splitToCeil = v => {
  v.forEach(s => {
    let ceil = s.split(',');

    if (ceil[0][0] === '[') processSection(ceil);
    else {
      let isUnit = true;
      for (let i = 0; i < ceil[0].length; i++) {
        if (ceil[0][i] === '.') {
          isUnit = false;
          break;
        }
      }

      if (isUnit) processUnit(ceil);
      else processChapter(ceil);
    }
  });
}

// オブジェクトを作成
let makeObject = (e, isProblem) => {
  e = {};

  if (isProblem) {
    e["correctCnt"] = 0;
    e["wrongCnt"] = 0;
    e["solveCnt"] = 0;
    e["lastAnswer"] = false;
    e["evenOnceAnswer"] = false;
    e["evenOnceWrong"] = false;
    e["year"] = 0;
    e["answerMark"] = "";
    e["genre"] = "";
  } else {
    e["name"] = "";
    e["problemCnt"] = 0;

    e["correctCnt"] = [];
    e["wrongCnt"] = [];
    e["solveCnt"] = [];
    e["lastAnswer"] = 0;
    e["evenOnceAnswer"] = 0;
    e["evenOnceWrong"] = 0;
  }

  return e;
}

// 単元の処理
let processUnit = v => {
  unitIndex = Number(v[0]) - 1;
  chapter[unitIndex] = [];
  section[unitIndex] = [];
  problem[unitIndex] = [];

  let e = unit[unitIndex];
  e = makeObject(e, false);

  e["name"] = v[1];
  // console.log("UNIT", unitIndex + 1, v);
  unit[unitIndex] = e;
}

// 章の処理
let processChapter = v => {
  let s = "";
  let del = true;
  for (let i = 0; i < v[0].length; i++) {
    if (!del) s += v[0][i];
    if (v[0][i] === '.') del = false;
  };

  chapIndex = Number(s) - 1;
  section[unitIndex][chapIndex] = [];
  problem[unitIndex][chapIndex] = [];

  let e = chapter[unitIndex][chapIndex];
  e = makeObject(e, false);

  e["name"] = v[1];
  // console.log("CHAP", chapIndex + 1, v);
  chapter[unitIndex][chapIndex] = e;
}

// 節の処理
let processSection = v => {
  let s = "";
  for (let i = 0; i < v[0].length; i++) {
    if (!(i === 0 || i === (v[0].length - 1))) s += v[0][i];
  };

  sectIndex = Number(s) - 1;
  problem[unitIndex][chapIndex][sectIndex] = [];

  let e = section[unitIndex][chapIndex][sectIndex];
  e = makeObject(e, false);

  e["name"] = v[1];
  // console.log("SECT", sectIndex + 1, v);
  section[unitIndex][chapIndex][sectIndex] = e;

  let problemCnt = Number(v[2]);
  for (let i = 0; i < 3; i++) v.shift();

  processProblem(v, problemCnt);
}

// 問題の処理
let processProblem = (v, cnt) => {
  for (let probIndex = 0; probIndex < cnt; probIndex++) {
    let e = problem[unitIndex][chapIndex][sectIndex][probIndex];
    e = makeObject(e, true);

    let year = String(magicNumber[all["problemCnt"]]);
    let ans = year[4];
    year = year.slice(0, -1);

    e["year"] = year;
    if (ans == 1) e["answerMark"] = "ア";
    else if (ans == 2) e["answerMark"] = "イ";
    else if (ans == 3) e["answerMark"] = "ウ";
    else if (ans == 4) e["answerMark"] = "エ";
    else e["answerMark"] = "ERROR";

    if (unitIndex < 7) e["genre"] = "T";
    else if (unitIndex == 7) e["genre"] = "S";
    else e["genre"] = "M";

    let s = v[probIndex];
    for (let i = 0; i < s.length; i++) {
      e["solveCnt"]++;

      if (s[i] === 'o') {
        e["correctCnt"]++;
        e["lastAnswer"] = true;
        e["evenOnceAnswer"] = true;
      } else if (s[i] === 'x') {
        e["wrongCnt"]++;
        e["lastAnswer"] = false;
        e["evenOnceWrong"] = true;
      } else {
        message.innerHTML = `進捗の記入に'o', 'x'以外の文字が使われているため、進捗を正しく集計出来ていない可能性があります。CSVファイルの内容をご確認ください。`;
        document.getElementById("message").style.color = "#f00";
      }
    }

    let ep = [];
    ep[0] = all;
    ep[1] = unit[unitIndex];
    ep[2] = chapter[unitIndex][chapIndex];
    ep[3] = section[unitIndex][chapIndex][sectIndex];

    for (let i = 0; i < 4; i++) {
      ep[i]["problemCnt"]++;
      if (e["lastAnswer"]) ep[i]["lastAnswer"]++;
      if (e["evenOnceAnswer"]) ep[i]["evenOnceAnswer"]++;
      if (e["evenOnceWrong"]) ep[i]["evenOnceWrong"]++;

      ep[i]["correctCnt"].push(e["correctCnt"]);
      ep[i]["correctCnt"].sort();
      ep[i]["wrongCnt"].push(e["wrongCnt"]);
      ep[i]["wrongCnt"].sort();
      ep[i]["solveCnt"].push(e["solveCnt"]);
      ep[i]["solveCnt"].sort();
    }

    all = ep[0];
    unit[unitIndex] = ep[1];
    chapter[unitIndex][chapIndex] = ep[2];
    section[unitIndex][chapIndex][sectIndex] = ep[3];
    problem[unitIndex][chapIndex][sectIndex][probIndex] = e;
  }
}

// 表を生成
let generateTable = () => {
  for (let i = 0; i < problem.length; i++) {
    generateSettingTable(i, -1, -1);

    for (let j = 0; j < problem[i].length; j++) {
      generateSettingTable(i, j, -1);

      for (let k = 0; k < problem[i][j].length; k++) {
        generateSettingTable(i, j, k);

      }
    }
  }
}

// 表の設定を定義
let generateSettingTable = (i, j, k) => {
  i++;
  j++;
  k++;
  let id = `table${i}_${j}_${k}`;

  let p = document.createElement("div");
  p.setAttribute("id", id);
  p.style.display = "none";
  if (i === 0 && j === 0 && k === 0) p.style.display = "block";
  let e = document.createElement("table");
  e.setAttribute("border", 1);
  e.setAttribute("cellpadding", "10");

  if (i === 0 && j === 0 && k === 0) {
    generateUnitTable(p, e);
  } else if (j === 0 && k === 0) {
    generateChapterTable(p, e, i);
  } else if (k === 0) {
    generateSectionTable(p, e, i, j);
  } else {
    generateProblemTable(p, e, i, j, k);
  }
}

let generateUnitTable = (p, e) => {
  let sum = all["problemCnt"];
  let once = sum - binarySearch(all["solveCnt"], 1);
  let rate = (once / sum * 100).toFixed(2);
  document.getElementById("allOnce").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${once}問解答)</span>`;

  let twice = sum - binarySearch(all["solveCnt"], 2);
  rate = (twice / sum * 100).toFixed(2);
  document.getElementById("allTwice").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${twice}問解答)</span>`;

  let sum2 = all["solveCnt"].length - binarySearch(all["solveCnt"], 1);
  let achievement = all["evenOnceAnswer"];
  let rate2 = ((achievement / sum2 * 100).toFixed(2));
  rate = (achievement / sum * 100).toFixed(2);
  document.getElementById("allAchievementA").innerHTML = `<span style="color:${changeColor(rate2)};">${rate2}%(${sum2}問中${achievement}問正解)</span>`;
  document.getElementById("allAchievementB").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${achievement}問正解)</span>`;

  let last = all["lastAnswer"];
  let rate3 = (last / sum2 * 100).toFixed(2);
  rate = (last / sum * 100).toFixed(2);
  document.getElementById("allUnderstandingA").innerHTML = `<span style="color:${changeColor(rate)};">${rate3}%(${sum2}問中${last}問正解)</span>`;
  document.getElementById("allUnderstandingB").innerHTML = `<span style="color:${changeColor(rate)};">${rate}%(${sum}問中${last}問正解)</span>`;

  let s = "";

  s += "<tr><th></th>";
  for (let i = 1; i <= unit.length; i++) s += `<th>単元${i}</th>`;
  s += "</tr>";

  s += "<tr><td><b>単元名</b></td>";
  for (let i = 0; i < unit.length; i++) s += `<td><a href="javascript:changeDisplay(${i + 1}, 0, 0);">${unit[i]["name"]}</a></td>`;
  s += "</tr>";

  s += "<tr><td><b>1回</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let once = sum - binarySearch(unit[i]["solveCnt"], 1);
    let rate = (once / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${once} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>2回</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let twice = sum - binarySearch(unit[i]["solveCnt"], 2);
    let rate = (twice / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${twice} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率A</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["solveCnt"].length - binarySearch(unit[i]["solveCnt"], 1);
    let achievement = unit[i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率B</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let achievement = unit[i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度A</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["solveCnt"].length - binarySearch(unit[i]["solveCnt"], 1);
    let last = unit[i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度B</b></td>";
  for (let i = 0; i < unit.length; i++) {
    let sum = unit[i]["problemCnt"];
    let last = unit[i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

let generateChapterTable = (p, e, u) => {
  u--;
  let title = document.createElement("p");
  title.innerHTML = `●単元${u + 1} ${unit[u]["name"]}`;
  p.appendChild(title);

  let s = "";

  s += "<tr><th></th>";
  for (let i = 1; i <= chapter[u].length; i++) s += `<th>${u + 1}.${i}</th>`;
  s += "</tr>";

  s += "<tr><td><b>チャプター名</b></td>";
  for (let i = 0; i < chapter[u].length; i++) s += `<td><a href="javascript:changeDisplay(${u + 1}, ${i + 1}, 0);">${chapter[u][i]["name"]}</a></td>`;
  s += "</tr>";

  s += "<tr><td><b>1回</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let once = sum - binarySearch(chapter[u][i]["solveCnt"], 1);
    let rate = (once / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${once} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>2回</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let twice = sum - binarySearch(chapter[u][i]["solveCnt"], 2);
    let rate = (twice / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${twice} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率A</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["solveCnt"].length - binarySearch(chapter[u][i]["solveCnt"], 1);
    let achievement = chapter[u][i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率B</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let achievement = chapter[u][i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度A</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["solveCnt"].length - binarySearch(chapter[u][i]["solveCnt"], 1);
    let last = chapter[u][i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度B</b></td>";
  for (let i = 0; i < chapter[u].length; i++) {
    let sum = chapter[u][i]["problemCnt"];
    let last = chapter[u][i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

let generateSectionTable = (p, e, u, c) => {
  u--;
  c--;
  let title = document.createElement("p");
  title.innerHTML = `●${u + 1}.${c + 1} ${chapter[u][c]["name"]}`;
  p.appendChild(title);

  let s = "";

  s += "<tr><th></th>";
  for (let i = 1; i <= section[u][c].length; i++) s += `<th>(${i})</th>`;
  s += "</tr>";

  s += "<tr><td><b>セクション名</b></td>";
  for (let i = 0; i < section[u][c].length; i++) s += `<td><a href="javascript:changeDisplay(${u + 1}, ${c + 1}, ${i + 1});">${section[u][c][i]["name"]}</a></td>`;
  s += "</tr>";

  s += "<tr><td><b>1回</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let once = sum - binarySearch(section[u][c][i]["solveCnt"], 1);
    let rate = (once / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${once} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>2回</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let twice = sum - binarySearch(section[u][c][i]["solveCnt"], 2);
    let rate = (twice / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${twice} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率A</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["solveCnt"].length - binarySearch(section[u][c][i]["solveCnt"], 1);
    let achievement = section[u][c][i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>達成率B</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let achievement = section[u][c][i]["evenOnceAnswer"];
    let rate = (achievement / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${achievement} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度A</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["solveCnt"].length - binarySearch(section[u][c][i]["solveCnt"], 1);
    let last = section[u][c][i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  s += "<tr><td><b>理解度B</b></td>";
  for (let i = 0; i < section[u][c].length; i++) {
    let sum = section[u][c][i]["problemCnt"];
    let last = section[u][c][i]["lastAnswer"];
    let rate = (last / sum * 100).toFixed(2);
    s += `<td style="background-color: ${changeBackgroundColor(rate)};"><span style="color:${changeColor(rate)};">${rate}%<br>(${last} / ${sum})</span></td>`;
  }
  s += "</tr>";

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

let generateProblemTable = (p, e, u, c, si) => {
  u--;
  c--;
  si--;
  let title = document.createElement("p");
  title.innerHTML = `●${u + 1}.${c + 1} (${si + 1}) ${section[u][c][si]["name"]}`;
  p.appendChild(title);

  let s = "";

  for (let r = 0; r < Math.ceil(problem[u][c][si].length / 15); r++) {
    s += "<tr><th></th>";
    for (let i = (r * 15 + 1); i <= Math.min(problem[u][c][si].length, (r + 1) * 15); i++) s += `<th>問${i}</th>`;
    s += "</tr>";

    s += "<tr><td><b>解いた回数</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      s += `<td>${problem[u][c][si][i]["solveCnt"]}回</td>`;
    }
    s += "</tr>";

    s += "<tr><td><b>正解した回数</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      s += `<td>${problem[u][c][si][i]["correctCnt"]}回</td>`;
    }
    s += "</tr>";

    s += "<tr><td><b>間違えた回数</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      s += `<td>${problem[u][c][si][i]["wrongCnt"]}回</td>`;
    }
    s += "</tr>";

    s += "<tr><td><b>最後に正解</b></td>";
    for (let i = (r * 15); i < Math.min(problem[u][c][si].length, (r + 1) * 15); i++) {
      let ans;
      if (problem[u][c][si][i]["lastAnswer"]) ans = 'o';
      else ans = 'x';
      s += `<td>${ans}</td>`;
    }
    s += "</tr>";
  }

  e.innerHTML = s;
  p.appendChild(e);
  document.getElementById("data").appendChild(p);
}

// 二分探索
let binarySearch = (v, key) => {
  let left = -1;
  let right = v.length;

  while (right - left > 1) {
    let mid = Math.floor(left + (right - left) / 2);
    if (v[mid] >= key) right = mid;
    else left = mid;
  }

  return right;
}

// 表の表示・非表示を切り替える
let changeDisplay = (u, c, si) => {
  for (let i = 1; i <= unit.length; i++) {
    document.getElementById(`table${i}_0_0`).style.display = "none";
  }

  for (let i = 1; i <= unit.length; i++) {
    for (let j = 1; j <= chapter[i - 1].length; j++) {
      for (let k = 0; k <= section[i - 1][j - 1].length; k++) {
        document.getElementById(`table${i}_${j}_${k}`).style.display = "none";
      }
    }
  }

  if (u !== 0) document.getElementById(`table${u}_0_0`).style.display = "block";
  if (c !== 0) document.getElementById(`table${u}_${c}_0`).style.display = "block";
  if (si !== 0) document.getElementById(`table${u}_${c}_${si}`).style.display = "block";
}

let changeColor = n => {
  if (n >= upBorder) return "#e00";
  else if (n < downBorder) return "#00e";
  else return "#000";
}

let changeBackgroundColor = n => {
  if (isHeatmap) {
    let baseOpacity = n / 250;
    if (isHundred && n == 100) return "#c4e2cb";
    else return `rgba(255, 0, 0, ${baseOpacity})`;
  }
  else return "#eee";
}

let changeMode = s => {
  if(s === "data") {
    document.getElementById("data").style.display = "block";
    document.getElementById("all").style.display = "block";
    document.getElementById("buttonData").style.color = "#fff";
    document.getElementById("buttonData").style.backgroundColor = "#31a9ee";
    document.getElementById("gacha").style.display = "none";
    document.getElementById("buttonGacha").style.color = "#000";
    document.getElementById("buttonGacha").style.backgroundColor = "#fff";
  } else {
    document.getElementById("data").style.display = "none";
    document.getElementById("all").style.display = "none";
    document.getElementById("buttonData").style.color = "#000";
    document.getElementById("buttonData").style.backgroundColor = "#fff";
    document.getElementById("gacha").style.display = "block";
    document.getElementById("buttonGacha").style.color = "#fff";
    document.getElementById("buttonGacha").style.backgroundColor = "#31a9ee";
  }
}

let makeSelectOption = () => {
  let d = document.getElementById("selectDownYear");
  let u = document.getElementById("selectUpYear");

  for(let i = oldYear; i <= newYear; i++) {
    let e1 = document.createElement("option");
    e1.setAttribute("value", String(i));
    e1.innerHTML = `${i}`;
    d.appendChild(e1);

    let e2 = document.createElement("option");
    e2.setAttribute("value", String(newYear + oldYear - i));
    e2.innerHTML = `${newYear + oldYear - i}`;
    u.appendChild(e2);
  }
}

let makeProblemList = () => {
  let p = document.getElementById("problemList");
  if (p != null) p.remove();
  p = document.createElement("ul");
  p.setAttribute("id", "problemList");
  problemList.length = 0;

  for (let i = 0; i < unit.length; i++) {
    for (let j = 0; j < chapter[i].length; j++) {
      for (let k = 0; k < section[i][j].length; k++) {
        for (let l = 0; l < problem[i][j][k].length; l++) {
          let prob = problem[i][j][k][l];

          if (downYear <= prob["year"] && prob["year"] <= upYear) {
            problemList.push([i, j, k, l]);
          }
        }
      }
    }
  }

  problemList.forEach(e => {
    console.log(e[0] + 1, e[1] + 1, e[2] + 1, e[3] + 1);
  });
}

let magicNumber = [20144, 19983, 20054, 20062, 20093, 20094, 20122, 20042, 20164, 20133, 19943, 19983, 19952, 20002, 20064, 20074, 19943, 20032, 19994, 20141, 20023, 20004, 20101, 20073, 20184, 20144, 20123, 19981, 20062, 20011, 20063, 20004, 20074, 20013, 20061, 20002, 20003, 20012, 20074, 20052, 20063, 20062, 20113, 20053, 20181, 20091, 20174, 20063, 20062, 20072, 20054, 20063, 20151, 20004, 20031, 20114, 20004, 20072, 20193, 20123, 20163, 20171, 20121, 20131, 19961, 20184, 20114, 20161, 20192, 20002, 20194, 20184, 20194, 20172, 20143, 20184, 20163, 20074, 20064, 20013, 20051, 20023, 20043, 20161, 20183, 20123, 20193, 20182, 20034, 20191, 20144, 20192, 20104, 20192, 20163, 20181, 20173, 20172, 20182, 20144, 20193, 20193, 20183, 20171, 20093, 20034, 20053, 20162, 20152, 20192, 20023, 20144, 20103, 20174, 20183, 20123, 20072, 20114, 20122, 20103, 20163, 20164, 20032, 20073, 19992, 20154, 19994, 20053, 19991, 20112, 20153, 20101, 20053, 20052, 20141, 20054, 20033, 20172, 20093, 20184, 20012, 20132, 19993, 20044, 20052, 19953, 19983, 20064, 20071, 20161, 20194, 20043, 20014, 20023, 20104, 20121, 19981, 19973, 20051, 20044, 20193, 19994, 20193, 20153, 20192, 20093, 20184, 20041, 20013, 20021, 19994, 19983, 20042, 20134, 20064, 19971, 20191, 20092, 20013, 20174, 20113, 20063, 20163, 20171, 20164, 20052, 20182, 20194, 20114, 20142, 20181, 20154, 20113, 20161, 20151, 20191, 20174, 20093, 20173, 20074, 20104, 20103, 20091, 20124, 20113, 20163, 20111, 20182, 20194, 20181, 20172, 20102, 20001, 19952, 20002, 20194, 20151, 20174, 20032, 20184, 19963, 19993, 20102, 20094, 20132, 20013, 20172, 20134, 20024, 20052, 20054, 20113, 20141, 20153, 20141, 20164, 20063, 20102, 20031, 20163, 20171, 20193, 20164, 20014, 20152, 20183, 20173, 20124, 20194, 20132, 20002, 20143, 20091, 20152, 20121, 20182, 20193, 20133, 20093, 20184, 20193, 20171, 20122, 20171, 20133, 20162, 20154, 20101, 20161, 20172, 20193, 20163, 20093, 20194, 20144, 20072, 20112, 20181, 20162, 20172, 20182, 20194, 20052, 20142, 20012, 20054, 20123, 20062, 20154, 20132, 20141, 20054, 20161, 19972, 20041, 20194, 20151, 20182, 20143, 20133, 20181, 20151, 20183, 20053, 20163, 20173, 20163, 20182, 20183, 20192, 20181, 20193, 20071, 20142, 20171, 20123, 20071, 20041, 20174, 20171, 20123, 20043, 20022, 20171, 20003, 20171, 20161, 20161, 20154, 20172, 20103, 20051, 20162, 20194, 20184, 20163, 20151, 20131, 20174, 20011, 20144, 20184, 20184, 20164, 20143, 20163, 20161, 20181, 20194, 20151, 20104, 20093, 20103, 20163, 20181, 20024, 20052, 20191, 20114, 20073, 20183, 20091, 20124, 20053, 20191, 20072, 20172, 20023, 20193, 20172, 20163, 20022, 19981, 20021, 20032, 20194, 20131, 20162, 20184, 20103, 20093, 20171, 20193, 20171, 20184, 20134, 20192, 20192, 20192, 20182, 20162, 20121, 20192, 20184, 20172, 20132, 20093, 20131, 20161, 20061, 20123, 20032, 20143, 20161, 20101, 20172, 20154, 20093, 20122, 20153, 20144, 20153, 20141, 20154, 20164, 20152, 20183, 20193, 20182, 20184, 20184, 20194, 20174, 20192, 20182, 20141, 20171, 20162, 20132, 20104, 20173, 20121, 20121, 20194, 20133, 20132, 20193, 20192, 20161, 20193, 20174, 20144, 20181, 20171, 20114, 20174, 20173, 20192, 20183, 20192, 20112, 20113, 20142, 20181, 20184, 20184, 20194, 20171, 20162, 20183, 20152, 20123, 20181, 20024, 20023, 20114, 20072, 20094, 19972, 20062, 20193, 20152, 20191, 20192, 20151, 20172, 20172, 20184, 20194, 20163, 20151, 20192, 20184, 20162, 20181, 19953, 20004, 20002, 20154, 20131, 20031, 20114, 20162, 20113, 20194, 20011, 20032, 20124, 20042, 20192, 20031, 20023, 20143, 20162, 20172, 20143, 20171, 20192, 20191, 20183, 19984, 20032, 19943, 20023, 20112, 20184, 20094, 20142, 20074, 20131, 20042, 20171, 20074, 20183, 19984, 20014, 20062, 20001, 20074, 20004, 20152, 20114, 20144, 20114, 20122, 20161, 20181, 20191, 20162, 20191, 20184, 20184, 20163, 20174, 20152, 20193, 20184, 20192, 20172, 20171, 20192, 20183, 20174, 20151, 20184, 20153, 20182, 20173, 20191, 20184, 20103, 20152, 20162, 20164, 20044, 20164, 20073, 20152, 20182, 20191, 20193, 20133, 20103, 20181, 20173, 20193, 20163, 20162, 20143, 20152, 20173, 20191, 20122, 20133, 20104, 20074, 20062, 20153, 20172, 20143, 20192, 20132, 20191, 20154, 20173, 20153, 20181, 20163, 20124, 20152, 20143, 20183, 20171, 20192, 20183, 20182, 20193, 20112, 20174, 20163, 20191, 20143, 20134, 20194, 20193, 20183, 20163, 20183, 20094, 20122, 20184, 20194, 20192, 20173, 20192, 20163, 20184, 20193, 20162, 20181, 20164, 20192, 20043, 20134, 20141, 20171, 20183, 20154, 20103, 20183, 20191, 20193, 20152, 20183, 20103, 19983, 20053, 20143, 20122, 20144, 20192, 20161, 20002, 19991, 20022, 20044, 20131, 20194, 20162, 20194, 20154, 20194, 19971, 20043, 20004, 20173, 20122, 20183, 20102, 20151, 20121, 20024, 20071, 20023, 20183, 20054, 20141, 20052, 20144, 20192, 20163, 20194, 20184, 20193, 20012, 20161, 20162, 20194, 20172, 20021, 20153, 20123, 20174, 20182, 20173, 20152, 20184, 20173, 20033, 20182, 20142, 20111, 20122, 20172, 20152, 20052, 20193, 20194, 20103, 20144, 20192, 20133, 20174, 20194, 20101, 20164, 20152, 20193, 20104, 19992, 20154, 20144, 20191, 20073, 20191, 20193, 20193, 20164, 20114, 20184, 20111, 20003, 20164, 20184, 20184, 20183, 20142, 20184, 20042, 20162, 20181, 20174, 20161, 20103, 20111, 20191, 20172, 20183, 20071, 20144, 20092, 20183, 20143, 20154, 20192, 20093, 20194, 20112, 20164, 20174, 20161, 20184, 20101, 20111, 20132, 20101, 20122, 20173, 20151, 20114, 20184, 20064, 20181, 20094, 20173, 20183, 20141, 20181, 20092, 20143, 20161, 20172, 20173, 20151, 20193, 20143, 20191, 20093, 20111, 20062, 20151, 20093, 20193, 20162, 20174, 20192, 20192, 20182, 20164, 20162, 20162, 20173, 20152, 20172, 20164, 20182, 20183, 20192, 20191, 20194, 20024, 20171, 20181, 20181, 20193, 20193, 20182, 20183, 20172, 20161, 20173, 20192, 20191, 20172, 20112, 20142, 20181, 20104, 20184, 20194, 20143, 20144, 20152, 20183, 20193, 20172, 20163, 20143, 20152, 20152, 20152, 20163, 20191, 20184, 20184, 20182, 20141, 20164, 20152, 20194, 20194, 20094, 20173, 20173, 20183, 20171, 20163, 20152, 20112, 20173, 20091, 20172, 20191, 20164, 20181, 20182, 20172, 20194, 20184, 20124, 20163, 20192, 20184, 20131, 20191, 20154, 20164, 20062, 20162, 20151, 20161, 20183, 20153, 20191, 20102, 20132, 20124, 20184, 20182, 20172, 20153, 20141, 20182, 20171, 20192, 20181, 20144, 20103, 20192, 20194, 20173, 20182, 20163, 20163, 20184, 20174, 20092, 20032, 20111, 20173, 20091, 20131, 20154, 20101, 20182, 20001, 20073, 20192, 20121, 20184, 20113, 20192, 20184, 20182, 20192, 20164, 20191, 20194, 20193, 20174, 20163, 20154, 20064, 20154, 20154, 20101, 20144, 20113, 20191, 20092, 20092, 20171, 20072, 20062, 20124, 20104, 20112, 20193, 20184, 20172, 20182, 20173, 20194, 20142, 20133, 20172, 20182, 20164, 20134, 20121, 20154, 20183, 20174, 20172, 20182, 20142, 20132, 20173, 20184, 20191, 20163, 20071, 20093, 20063, 20091, 20104, 20123, 20162, 20073, 20181, 20144, 20113, 20191, 20184, 20153, 20161, 20131, 20192, 20144, 20184, 20192, 20164, 20153, 20192, 20194, 20182, 20131, 20194, 20193, 20162, 20173, 20183, 20193, 20184, 20154, 20191, 20131, 20192, 20192, 20192, 20144, 20172, 20181, 20094, 20173, 20191, 20191, 20174, 20181, 20171, 20182, 20194, 20163, 20142, 20182, 20171, 20163, 20194, 20194, 20124, 20191, 20171, 20171, 20182, 20173, 20191, 20184, 20192, 20174, 20182, 20194, 20184, 20154, 20112, 20151];
