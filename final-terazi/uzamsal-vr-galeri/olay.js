document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-fo1]').forEach(el=>el.addEventListener('click',function(event){
focusWall('center', this)
}));
  document.querySelectorAll('[data-fo2]').forEach(el=>el.addEventListener('click',function(event){
focusWall('left', this)
}));
  document.querySelectorAll('[data-fo3]').forEach(el=>el.addEventListener('click',function(event){
focusWall('right', this)
}));
  document.querySelectorAll('[data-fo4]').forEach(el=>el.addEventListener('click',function(event){
togglePalette('siyah-yasak')
}));
  document.querySelectorAll('[data-fo5]').forEach(el=>el.addEventListener('click',function(event){
togglePalette('terracotta')
}));
  document.querySelectorAll('[data-fo6]').forEach(el=>el.addEventListener('click',function(event){
toggleVR()
}));
  document.querySelectorAll('[data-fo7]').forEach(el=>el.addEventListener('click',function(event){
focusWall('left')
}));
  document.querySelectorAll('[data-fo8]').forEach(el=>el.addEventListener('click',function(event){
focusWall('center')
}));
  document.querySelectorAll('[data-fo9]').forEach(el=>el.addEventListener('click',function(event){
focusWall('right')
}));
  document.querySelectorAll('[data-fo10]').forEach(el=>el.addEventListener('click',function(event){
generateVideo()
}));
});
