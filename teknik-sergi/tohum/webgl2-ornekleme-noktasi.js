register({
  baslik: '50.000 kapı bulutu',
  aciklama: 'WebGL2 ile 50.000 nokta tek çizimde: gl_VertexID ızgara ↔ küre arasında yumuşak geçiş yapar; kapı ızgarası bağlamı.',
  mount: function (host, api) {
    var c = document.createElement('canvas'), gl = c.getContext('webgl2', { antialias: true }), P = api.palette;
    c.className = 'ts-tam'; host.appendChild(c);
    if (!gl) { host.innerHTML = '<p class="ts-uyari">WebGL2 bu tarayıcıda yok.</p>'; return function () {}; }
    function renk(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
    var vs = '#version 300 es\nprecision highp float;uniform float T,M,S;uniform vec2 R;uniform vec3 A,B,C;out vec3 col;' +
      'void main(){float i=float(gl_VertexID);float gx=mod(i,250.),gy=floor(i/250.);' +
      'vec3 g=vec3((gx/249.-.5)*2.2,(gy/199.-.5)*1.7,0.);float k=i+.5,ph=acos(1.-2.*k/50000.),th=2.399963*k;' +
      'vec3 s=vec3(sin(ph)*cos(th),cos(ph),sin(ph)*sin(th));vec3 p=mix(g,s,M);float a=T*.35;' +
      'p=vec3(p.x*cos(a)+p.z*sin(a),p.y,-p.x*sin(a)+p.z*cos(a));p.z+=3.;float asp=R.x/R.y;' +
      'gl_Position=vec4(p.x*1.7/asp,p.y*1.7,0.,p.z);gl_PointSize=S*(1.6/p.z+.6);' +
      'float r1=fract(i*.0001),r2=fract(i*.00037);col=mix(mix(A,B,r1),C,step(.88,r2))*(.55+.6/p.z);}';
    var fs = '#version 300 es\nprecision highp float;in vec3 col;out vec4 o;void main(){vec2 d=gl_PointCoord-.5;if(dot(d,d)>.25)discard;o=vec4(col,1.);}';
    function derle(t, s) { var sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; }
    var pr = gl.createProgram(); gl.attachShader(pr, derle(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, derle(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
    function u(n) { return gl.getUniformLocation(pr, n); }
    gl.uniform3fv(u('A'), renk(P.a)); gl.uniform3fv(u('B'), renk(P.b)); gl.uniform3fv(u('C'), renk(P.c));
    var z = renk(P.bg);
    function fit() { c.width = Math.max(2, Math.floor(api.width * api.dpr)); c.height = Math.max(2, Math.floor(api.height * api.dpr)); gl.viewport(0, 0, c.width, c.height); gl.uniform2f(u('R'), c.width, c.height); gl.uniform1f(u('S'), 2.2 * api.dpr); }
    fit(); api.onResize(fit);
    function ciz(t, m) { gl.clearColor(z[0], z[1], z[2], 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform1f(u('T'), t); gl.uniform1f(u('M'), m); gl.drawArrays(gl.POINTS, 0, 50000); }
    if (api.reducedMotion) { ciz(0.6, 0.35); return function () {}; }
    var dur = api.raf(function () { var t = api.time() / 1000; ciz(t, 0.5 + 0.5 * Math.sin(t * 0.55)); });
    return function () { dur(); };
  }
});
