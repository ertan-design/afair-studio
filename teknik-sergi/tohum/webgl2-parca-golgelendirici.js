register({
  baslik: 'Alan çarpıtma gölgelendiricisi',
  aciklama: 'WebGL2 parça gölgelendirici: fbm ile alan çarpıtma (domain warping) ve palet karışımı; geçiş perdesi için akışkan zemin.',
  mount: function (host, api) {
    var c = document.createElement('canvas'), gl = c.getContext('webgl2', { antialias: false }), P = api.palette;
    c.className = 'ts-tam'; host.appendChild(c);
    if (!gl) { host.innerHTML = '<p class="ts-uyari">WebGL2 bu tarayıcıda yok.</p>'; return function () {}; }
    function renk(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
    var vs = '#version 300 es\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}';
    var fs = '#version 300 es\nprecision highp float;uniform vec2 R;uniform float T;uniform vec3 A,B,C,Z;out vec4 o;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
      'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}' +
      'void main(){vec2 u=(gl_FragCoord.xy-.5*R)/R.y*2.2;float t=T*.12;vec2 q=vec2(fbm(u+t),fbm(u+vec2(5.2,1.3)-t));' +
      'vec2 r=vec2(fbm(u+3.*q+vec2(1.7,9.2)+t*1.3),fbm(u+3.*q+vec2(8.3,2.8)-t));float f=fbm(u+3.*r);' +
      'vec3 col=mix(Z,A,clamp(f*1.6,0.,1.));col=mix(col,B,clamp(length(q)*.9,0.,1.)*.7);col=mix(col,C,clamp(r.x,0.,1.)*.5);col+=.18*pow(f,3.)*vec3(1);o=vec4(col,1);}';
    function derle(t, s) { var sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; }
    var pr = gl.createProgram(); gl.attachShader(pr, derle(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, derle(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
    function u(n) { return gl.getUniformLocation(pr, n); }
    gl.uniform3fv(u('A'), renk(P.a)); gl.uniform3fv(u('B'), renk(P.b)); gl.uniform3fv(u('C'), renk(P.c)); gl.uniform3fv(u('Z'), renk(P.bg));
    function fit() { c.width = Math.max(2, Math.floor(api.width * api.dpr * 0.75)); c.height = Math.max(2, Math.floor(api.height * api.dpr * 0.75)); gl.viewport(0, 0, c.width, c.height); gl.uniform2f(u('R'), c.width, c.height); }
    fit(); api.onResize(fit);
    function ciz(t) { gl.uniform1f(u('T'), t / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    if (api.reducedMotion) { ciz(4000); return function () {}; }
    var dur = api.raf(function () { ciz(api.time()); });
    return function () { dur(); };
  }
});
