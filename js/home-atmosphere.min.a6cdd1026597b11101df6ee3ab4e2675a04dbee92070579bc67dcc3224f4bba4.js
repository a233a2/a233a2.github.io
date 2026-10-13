(()=>{const n=document.querySelector("[data-aurora-canvas]"),i=n?.closest(".home-shell");if(!n||!i)return;const p=document.documentElement,x=matchMedia("(prefers-reduced-motion: reduce)"),E=1e3/30;let f=p.getAttribute("data-scheme")==="dark",j=!("IntersectionObserver"in window),h=!1,a=!1,r=!1,e=null,t=null,o=null,u=null,d=0,l=!1,c=null,v=0,O=0;const k=`
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
            v_uv = a_position * .5 + .5;
            gl_Position = vec4(a_position, 0., 1.);
        }
    `,A=`
        #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
        #else
            precision mediump float;
        #endif
        varying vec2 v_uv;
        uniform float u_time;
        uniform float u_dark;

        // Static, spatial grain hides gradient banding without temporal noise.
        float grain(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * .1031);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        float softNoise(vec2 p) {
            vec2 cell = floor(p);
            vec2 f = fract(p);
            f = f * f * (3. - 2. * f);
            return mix(
                mix(grain(cell), grain(cell + vec2(1., 0.)), f.x),
                mix(grain(cell + vec2(0., 1.)), grain(cell + vec2(1.)), f.x),
                f.y
            );
        }

        void main() {
            vec2 uv = vec2(v_uv.x, 1. - v_uv.y);
            float t = u_time * .03;

            // Three low-frequency noise samples bend light into soft, uneven
            // folds. No multi-octave loop or per-frame random texture is needed.
            vec2 warp = vec2(
                softNoise(uv * 2.7 + vec2(2.3 + t * .2, 5.7)),
                softNoise(uv * 2.7 + vec2(9.1, 3.4 - t * .17))
            );
            vec2 p = uv + (warp - .5) * .48;
            p.x += .12 * sin(uv.y * 4.1 + t);
            p.y += .09 * sin(uv.x * 4.4 - t * .83);
            float cloud = softNoise(p * 3.3 + vec2(4.6 - t * .14, 8.2 + t * .12));
            float fold = sin(p.x * 4.6 - p.y * 3.3 + (cloud - .5) * 2.4 + t * .56);
            float drift = cos(p.x * 2.8 + p.y * 4.8 + warp.x * 1.6 - t * .47);

            float teal = (1. - smoothstep(.05, .72, p.x))
                       * smoothstep(-.65, .9, sin(p.y * 3.5 - p.x * 2.1 + t * .68));
            float blue = smoothstep(-.88, .78, fold)
                         * (1. - smoothstep(.57, 1.2, p.x))
                         * (.55 + .45 * smoothstep(-.8, .9, drift));
            float mist = smoothstep(.18, .78, p.x)
                         * (1. - smoothstep(.7, 1.3, p.x))
                         * smoothstep(-.85, .95, sin(p.y * 4.3 + p.x * 2.7 - t * .72));
            float ivory = smoothstep(.71, 1.17, p.x)
                         * smoothstep(-.5, .95, cos(p.y * 3.7 + t * .52));

            float depth = smoothstep(.18, .82, cloud);
            float pearl = smoothstep(.47, .82, cloud)
                        * smoothstep(-.3, .85, drift);
            vec2 center = (uv - vec2(.5, .44)) * vec2(1.45, 1.);
            float quiet = 1. - smoothstep(.06, .58, length(center));

            // Light mode is translucent pearl, ice blue, sea glass and ivory.
            // Mixing pigments keeps even overlapping folds pale and restrained.
            vec3 lightColor = vec3(.91, .94, .97);
            lightColor = mix(lightColor, vec3(.65, .83, .81), teal * .55);
            lightColor = mix(lightColor, vec3(.64, .78, .90), blue * .72);
            lightColor = mix(lightColor, vec3(.78, .83, .90), mist * .44);
            lightColor = mix(lightColor, vec3(.96, .90, .79), ivory * .7);
            lightColor -= vec3(.10, .12, .135) * (1. - depth) * .17;
            lightColor = mix(lightColor, vec3(.98, .99, 1.), pearl * .28);
            lightColor = mix(lightColor, vec3(.94, .96, .98), quiet * .26);

            // Dark mode has its own low-luminance slate and muted teal palette.
            vec3 darkColor = vec3(.031, .052, .075);
            darkColor = mix(darkColor, vec3(.073, .21, .225), teal * .64);
            darkColor = mix(darkColor, vec3(.16, .29, .43), blue * .75);
            darkColor = mix(darkColor, vec3(.19, .235, .30), mist * .45);
            darkColor = mix(darkColor, vec3(.26, .28, .285), ivory * .28);
            darkColor *= .8 + .3 * depth;
            darkColor += vec3(.14, .18, .22) * pearl * .2;
            darkColor *= 1. - quiet * .18;

            vec3 color = mix(lightColor, darkColor, u_dark);
            color += (grain(gl_FragCoord.xy) - .5) * mix(.004, .006, u_dark);
            gl_FragColor = vec4(color, 1.);
        }
    `;function m(){l=!1,cancelAnimationFrame(d),d=0,c=null}function y(){e&&!e.isContextLost()&&(o&&e.deleteBuffer(o),t&&e.deleteProgram(t)),o=null,t=null,u=null}function _(){m(),a=!0,n.classList.remove("is-ready"),y()}function w(t,n){const s=e.createShader(t);if(!s)throw new Error("Shader unavailable");if(e.shaderSource(s,n),e.compileShader(s),!e.getShaderParameter(s,e.COMPILE_STATUS))throw e.deleteShader(s),new Error("Shader unsupported");return s}function S(){if(t)return!0;if(a||r)return!1;let s=null,i=null;try{if(e=e||n.getContext("webgl",{alpha:!1,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1,powerPreference:"low-power"}),!e||e.isContextLost())throw new Error("WebGL unavailable");if(s=w(e.VERTEX_SHADER,k),i=w(e.FRAGMENT_SHADER,A),t=e.createProgram(),!t)throw new Error("Program unavailable");if(e.attachShader(t,s),e.attachShader(t,i),e.linkProgram(t),!e.getProgramParameter(t,e.LINK_STATUS))throw new Error("Program unsupported");if(e.useProgram(t),o=e.createBuffer(),!o)throw new Error("Buffer unavailable");e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);const a=e.getAttribLocation(t,"a_position");if(e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),u={time:e.getUniformLocation(t,"u_time"),dark:e.getUniformLocation(t,"u_dark")},e.disable(e.DEPTH_TEST),e.disable(e.BLEND),g(),e.getError()!==e.NO_ERROR)throw new Error("Drawing unavailable");return!0}catch{return _(),!1}finally{e&&!e.isContextLost()&&(s&&e.deleteShader(s),i&&e.deleteShader(i))}}function b(){if(!t||r||a||e.isContextLost())return;try{e.viewport(0,0,n.width,n.height),e.uniform1f(u.time,O/1e3),e.uniform1f(u.dark,f?1:0),e.drawArrays(e.TRIANGLES,0,3),n.classList.add("is-ready")}catch{_()}}function g(){if(!t||r||a)return;const e=n.getBoundingClientRect();if(e.width<=0||e.height<=0)return;const s=Math.min(.8,1100/e.width,750/e.height),o=Math.max(1,Math.round(e.width*s)),i=Math.max(1,Math.round(e.height*s));(n.width!==o||n.height!==i)&&(n.width=o,n.height=i),b()}function C(e){if(!l)return;c!==null&&(O+=Math.min(e-c,100)),c=e;const t=e-v;t>=E&&(v=e-t%E,b()),l&&(d=requestAnimationFrame(C))}function s(){if(a||r)return;const e=j&&!document.hidden&&!h;e&&!t&&S();const n=Boolean(t)&&e&&!x.matches&&!i.classList.contains("is-paused")&&!i.classList.contains("is-page-hidden")&&!i.classList.contains("is-motion-paused");if(n===l)return;if(!n){m();return}l=!0,c=null,v=performance.now(),d=requestAnimationFrame(C)}n.addEventListener("webglcontextlost",e=>{e.preventDefault(),r=!0,m(),n.classList.remove("is-ready"),y()}),n.addEventListener("webglcontextrestored",()=>{r=!1,a=!1,s()}),new MutationObserver(s).observe(i,{attributes:!0,attributeFilter:["class"]}),new MutationObserver(()=>{const e=p.getAttribute("data-scheme")==="dark";if(e===f)return;f=e,b()}).observe(p,{attributes:!0,attributeFilter:["data-scheme"]}),"IntersectionObserver"in window&&new IntersectionObserver(e=>{j=e[0].isIntersecting,s()}).observe(i),"ResizeObserver"in window?new ResizeObserver(g).observe(n):window.addEventListener("resize",g,{passive:!0}),x.addEventListener("change",s),document.addEventListener("visibilitychange",s),window.addEventListener("pagehide",()=>{h=!0,s()}),window.addEventListener("pageshow",()=>{h=!1,s()}),s()})()