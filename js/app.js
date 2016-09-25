const electron = require('electron')
const ipc = electron.ipcRenderer

let gameover = false
let cellNum = [10, 16]
let boomNum = [12, 40]
let level = 0
let time = 0
let boom = []

let color = ["", "#99CCFF", "#CCCC33", "#0099CC", "#3366CC", "#336699", "#336666", "#336666", "#336666"]

let getRandomNum = function(boom) {
  let ran = parseInt(Math.random() * cellNum[level] * cellNum[level])
  if (boom.indexOf(ran) > -1)
    return getRandomNum(boom)
  return ran
}

let toggleDemon = function(onoff) {
  if (onoff + "" == "true") {
    for (let i = 0; i < boom.length; i++) { $("[data-index="+ boom[i] +"]").css({color: "#000"}) }
  } else {
    for (let i = 0; i < boom.length; i++) { $("[data-index="+ boom[i] +"]").css({color: "#FF9966"}) }
  }
}

ipc.on('toggleDemon', function(event, message){
  console.log(message);
  toggleDemon(message)
});

$(function(){
  console.log("启动程序..")

  let box = $("#box")
  let timeElem = $("#time")
  timer = {}

  let initailze = function() {
    gameover = false
    box.html("")
    boom = []
    time = 0

    console.log(level);

    if (level == 1) {
      box.addClass("mibble")
    } else {
      box.removeClass("mibble")
    }

    clearInterval(timer)
    timeElem.removeClass("start").html("时间：0")

    buildCell(0, function(){
      setTimeout(function(){
        bindClickForCell()

        for (let i = 0; i < boomNum[level]; i++) {
          boom.push(getRandomNum(boom))
        }

        // for (let i = 0; i < boom.length; i++) { $("[data-index="+ boom[i] +"]").css({color: "#000"}) }
      }, 0)
    })
  }

  let buildCell = function(i, fn) {
    if (i >= cellNum[level] * cellNum[level]) {
      if (fn && fn != null) {
        fn()
      }
      return
    }

    let cell = $("<div class='cell' data-index='"+ i +"'>○</div>")
    box.append(cell)

    doAnimate(cell, "rollIn animated")

    setTimeout(function(){
      buildCell(++i, fn)
    }, 5)
  }

  let bindClickForCell = function() {
    let TimeFn = null

    box.find(".cell").mousedown(function(e){
      let _this = $(this)

      if (! timeElem.hasClass("start")) {
        timeElem.addClass("start")
        timer = setInterval(function(){
          time = parseFloat((time + 0.1).toFixed(1))
          timeElem.html("时间：" + time)
        }, 100)
      }

      if(3 == e.which){
        // alert('这 是右键单击事件')
        if (gameover || $(this).hasClass("open")) {
          return
        }
        let html = $(this).html()
        if (html == "○") {
          $(this).html("X").css({color: "#666"})
        } else {
          $(this).html("○").css({color: "#FF9966"})
        }
      }else if(1 == e.which){
        // alert('这 是左键单击事件')
        if (gameover || _this.hasClass("open")) {
          return
        }
        let i = parseInt(_this.attr("data-index"))

        open(i)
      }

    })

  }

  $("#start").off("click").on("click", function(){
    initailze()
  })

  $("#setting").off("click").on("click", function(){
    if (level == 0) {
      level = 1
      $(this).html("困难")
    } else {
      level = 0
      $(this).html("简单")
    }
    initailze()
  })

  let open = function(i) {
    let cell = $("[data-index="+ i +"]")
    if (cell.hasClass("open")) {
      return
    }
    if (isBoom(i)) {
      return lose(i)
    }

    doAnimate(cell, "pulse animated")
    cell.addClass("open")

    let n = getBoomNum(i)
    if (n == 0) {
      cell.css({color: "#ddd"})

      setTimeout(function(){
        iterator(i, function(index){
          open(index)
        })
      }, 20)
    } else {
      cell.html(n).css({color: color[n]})
    }
    if ($(".cell:not(.open)").length == boomNum[level]) {
      win()
    }
  }

  let getBoomNum = function(i) {
    let n = 0
    iterator(i, function(index){
      if (isBoom(index)) {
        n++
      }
    })
    return n
  }

  let iterator = function(i, fn) {
    let x = i % cellNum[level]
    let y = parseInt(i / cellNum[level])

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let _x = x + i
        let _y = y + j
        if (_x < 0 || _x > cellNum[level] - 1 || _y < 0 || _y > cellNum[level] - 1 || (i == 0 && j == 0)) {
          continue
        }
        let index = _y * cellNum[level] + _x
        fn(index)
      }
    }
  }

  let isBoom = function(i) {
    if (boom.indexOf(i) > -1) {
      return true
    }
    return false
  }

  let lose = function(i) {
    let index = boom[boom.indexOf(i)]
    boom.splice(index, 1)

    doBoom(index, function(){
      popup("你输了~~")
    })

    clearInterval(timer)
    gameover = true
  }
  let win = function(i) {
    for (let i = 0; i < boom.length; i++) {
      $("[data-index="+ boom[i] +"]").html("☺").css({color: "#666"}).addClass("rubberBand animated")
    }
    popup("你赢啦！花了 "+ time + "秒")
    sound("win")

    clearInterval(timer)
    gameover = true
  }

  let doBoom = function(index, fn) {
    $("[data-index="+ index +"]").html("☀").addClass("tada animated boom")
    sound("boom")

    if (boom.length == 0) {
      if (fn && fn != null) {
        fn()
      }
      return
    }
    setTimeout(function(){
      doBoom(boom.pop(), fn)
    }, 100)
  }

  let doAnimate = function(cell, clazz) {
    cell.addClass(clazz)
    setTimeout(function(){
      cell.removeClass(clazz)
    }, 500)
  }

  window.sound = function(filename) {
    let s = $("<audio src='sound/"+ filename +".wav' controls='controls' hidden='true'>")
    $(".sound").append(s)
    setTimeout(function(){
      let audio = $(".sound audio:last")
      audio[0].play()

      setTimeout(function(){
        audio.remove()
      }, 1000)
    }, 0)

    // $(".boom")[0].play()
  }

  $('#test').avgrund({
    height: 130,
    width: 400,
    holderClass: 'custom',
    showClose: true,
    showCloseText: '关闭',
    onBlurContainer: '.container',
    template: $(".popup")
  })

  let popup = function(msg) {
    $('#test').click()
    $(".popup").find("h2").html(msg)
  }

  initailze()
})
