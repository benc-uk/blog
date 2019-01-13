const fs = require('fs')
var Trianglify = require('trianglify')

// https://uigradients.com

let colours = [
  {list: ['#FC466B', '#3F5EFB']},
  {list: ['#ad5389', '#3c1053']},
  {list: ['#1a2a6c', '#b21f1f', '#fdbb2d']},
  {list: ['#36D1DC', '#0b2f7c']},
  {list: ['#10bdae', '#173380']},
  {list: ['#1A2980', '#26D0CE']},
  {list: ['#c21500', '#ffc500']},
  {list: ['#F0C27B', '#4B1248']},
  {list: ['#00bf8f', '#001510']},
  {list: ['#0052D4', '#4364F7', '#6FB1FC']},
  {list: ['#FF8C00', '#6FB1FC']},
  {list: ['#200122', '#6f0000']},
  {list: ['#ff0084', '#33001b']},
  {list: ['#FC354C', '#0ABFBC']},
  {list: ['#f79d00', '#64f38c']},
  {list: ['#ffd89b', '#19547b']},
  {list: ['#F0F2F0', '#000C40']},
  {list: ['#000046', '#1CB5E0']},
  {list: ['#e42d20', '#470f11']},
  {list: ['#00F260', '#0575E6']},
  {list: ['#ff00cc', '#0b2f7c']},
]
let i = 0

for(let c of colours) {
  var pattern = Trianglify({
    width: 1200, 
    height: 300,
    cell_size: 40,
    x_colors: c.list,
    y_colors: c.list
  })
  let svg = pattern.svg({includeNamespace: true})
  fs.writeFileSync(`h${i.toString().padStart(2, '0')}.svg`, svg.outerHTML)
  i++
}