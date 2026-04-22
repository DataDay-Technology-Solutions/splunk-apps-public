/**
 * Splunk Innovators Toolkit - Catalog Engine
 * ============================================
 * Powers the visual component catalog/showroom.
 * Renders component cards with live previews, copy buttons, and demo links.
 */

require([
    'jquery',
    'underscore',
    
], function($, _) {
    'use strict';

    // ========================================
    // Component Registry
    // ========================================

    var TOOLKIT_APP = 'splunk-innovators-toolkit';

    var components = {
        backgrounds: [
            { name: 'animated-mesh-gradient', label: 'Animated Mesh Gradient', type: 'css', difficulty: 'beginner', cloud: true, description: 'Slowly shifting color mesh gradient with overlapping radial gradients.', preview: 'background: linear-gradient(45deg, #0a0a2e, #1a0a3e, #0a1a3e); background-size: 400% 400%; animation: sit-cat-mesh 8s ease infinite;',
              previewHtml: '<div style="width:100%;height:100%;background:linear-gradient(45deg,#0a0a2e,#1a0a3e,#0a1a3e,#2a0a4e);background-size:400% 400%;animation:sit-cat-mesh 8s ease infinite"></div>' },
            { name: 'particle-network', label: 'Particle Network', type: 'js', difficulty: 'beginner', cloud: true, description: 'Interactive particle constellation with connected dots that respond to mouse movement.', preview: 'background: radial-gradient(circle at 30% 50%, rgba(253,24,117,0.15), transparent 60%), radial-gradient(circle at 70% 50%, rgba(23,162,184,0.15), transparent 60%), #0a0e17;',
              previewHtml: '<div style="width:100%;height:100%;background:#0a0e17;position:relative;overflow:hidden"><svg viewBox="0 0 120 80" style="width:100%;height:100%"><circle cx="20" cy="15" r="2" fill="rgba(253,24,117,0.8)"><animate attributeName="cy" values="15;25;15" dur="4s" repeatCount="indefinite"/></circle><circle cx="55" cy="40" r="2.5" fill="rgba(23,162,184,0.8)"><animate attributeName="cx" values="55;65;55" dur="5s" repeatCount="indefinite"/></circle><circle cx="90" cy="20" r="2" fill="rgba(253,24,117,0.8)"><animate attributeName="cy" values="20;10;20" dur="3s" repeatCount="indefinite"/></circle><circle cx="35" cy="60" r="1.5" fill="rgba(23,162,184,0.6)"><animate attributeName="cx" values="35;45;35" dur="4s" repeatCount="indefinite"/></circle><circle cx="75" cy="55" r="2" fill="rgba(253,24,117,0.6)"><animate attributeName="cy" values="55;45;55" dur="3.5s" repeatCount="indefinite"/></circle><circle cx="105" cy="65" r="1.5" fill="rgba(23,162,184,0.7)"></circle><line x1="20" y1="15" x2="55" y2="40" stroke="rgba(253,24,117,0.15)" stroke-width="0.5"/><line x1="55" y1="40" x2="90" y2="20" stroke="rgba(23,162,184,0.15)" stroke-width="0.5"/><line x1="35" y1="60" x2="75" y2="55" stroke="rgba(253,24,117,0.12)" stroke-width="0.5"/><line x1="75" y1="55" x2="105" y2="65" stroke="rgba(23,162,184,0.12)" stroke-width="0.5"/><line x1="55" y1="40" x2="35" y2="60" stroke="rgba(253,24,117,0.1)" stroke-width="0.5"/></svg></div>' },
            { name: 'matrix-data-rain', label: 'Matrix Data Rain', type: 'js', difficulty: 'beginner', cloud: true, description: 'Falling characters Matrix-style with green data rain columns.', preview: 'background: #000a00; box-shadow: inset 0 0 100px rgba(0,255,0,0.05);',
              previewHtml: '<div style="width:100%;height:100%;background:#000a00;position:relative;overflow:hidden;font-family:monospace;font-size:10px;color:#00ff00"><div style="position:absolute;top:0;left:8%;animation:sit-cat-rain 2s linear infinite;opacity:0.9">01</div><div style="position:absolute;top:0;left:22%;animation:sit-cat-rain 1.5s linear infinite;animation-delay:0.3s;opacity:0.7">&#x30A2;</div><div style="position:absolute;top:0;left:38%;animation:sit-cat-rain 2.2s linear infinite;animation-delay:0.7s;opacity:0.8">10</div><div style="position:absolute;top:0;left:55%;animation:sit-cat-rain 1.8s linear infinite;animation-delay:0.1s;opacity:0.6">&#x30AB;</div><div style="position:absolute;top:0;left:70%;animation:sit-cat-rain 2.5s linear infinite;animation-delay:0.5s;opacity:0.9">11</div><div style="position:absolute;top:0;left:85%;animation:sit-cat-rain 1.7s linear infinite;animation-delay:0.9s;opacity:0.5">&#x30B5;</div></div>' },
            { name: 'gradient-wave-motion', label: 'Gradient Wave Motion', type: 'css', difficulty: 'beginner', cloud: true, description: 'Smooth flowing wave gradients with multiple undulating layers.', preview: 'background: linear-gradient(180deg, #0a0e27 0%, #1a1040 50%, #0d1933 100%);',
              previewHtml: '<div style="width:100%;height:100%;background:linear-gradient(180deg,#0a0e27,#1a1040,#0d1933);position:relative;overflow:hidden"><div style="position:absolute;bottom:0;left:-50%;width:200%;height:40%;background:rgba(26,16,64,0.5);border-radius:45%;animation:sit-cat-wave 6s ease-in-out infinite"></div><div style="position:absolute;bottom:-5%;left:-50%;width:200%;height:35%;background:rgba(13,25,51,0.5);border-radius:40%;animation:sit-cat-wave 8s ease-in-out infinite reverse"></div></div>' },
            { name: 'cyberpunk-grid-pulse', label: 'Cyberpunk Grid Pulse', type: 'css', difficulty: 'beginner', cloud: true, description: 'Neon perspective grid extending to horizon with animated pulse lines.', preview: 'background: linear-gradient(180deg, #0a001a 0%, #1a0033 60%, #330044 100%);',
              previewHtml: '<div style="width:100%;height:100%;background:linear-gradient(180deg,#0a001a,#1a0033,#330044);position:relative;overflow:hidden"><div style="position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(transparent 0%,rgba(255,0,255,0.05) 100%);background-size:20px 20px;background-image:linear-gradient(rgba(255,0,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,0,255,0.15) 1px,transparent 1px);transform:perspective(200px) rotateX(40deg);transform-origin:bottom"></div><div style="position:absolute;bottom:40%;left:0;right:0;height:2px;background:rgba(255,0,255,0.4);box-shadow:0 0 10px rgba(255,0,255,0.3);animation:sit-cat-pulse-line 3s ease-in-out infinite"></div></div>' },
            { name: 'starfield-parallax', label: 'Starfield Parallax', type: 'js', difficulty: 'beginner', cloud: true, description: 'Multi-layer depth-scrolling star field creating a parallax space effect.', preview: 'background: radial-gradient(ellipse at center, #0a0e2a 0%, #000005 100%);',
              previewHtml: '<div style="width:100%;height:100%;background:radial-gradient(ellipse at center,#0a0e2a,#000005);position:relative;overflow:hidden"><div style="position:absolute;width:2px;height:2px;background:#fff;border-radius:50%;top:15%;left:20%;box-shadow:0 0 3px #fff;animation:sit-cat-twinkle 2s ease-in-out infinite"></div><div style="position:absolute;width:1px;height:1px;background:#aaf;border-radius:50%;top:30%;left:65%;animation:sit-cat-twinkle 3s ease-in-out infinite 0.5s"></div><div style="position:absolute;width:2px;height:2px;background:#fff;border-radius:50%;top:60%;left:40%;box-shadow:0 0 2px #fff;animation:sit-cat-twinkle 2.5s ease-in-out infinite 1s"></div><div style="position:absolute;width:1px;height:1px;background:#ccf;border-radius:50%;top:75%;left:80%;animation:sit-cat-twinkle 1.8s ease-in-out infinite 0.3s"></div><div style="position:absolute;width:1.5px;height:1.5px;background:#fff;border-radius:50%;top:20%;left:85%;box-shadow:0 0 4px #aaf;animation:sit-cat-twinkle 2.2s ease-in-out infinite 0.7s"></div><div style="position:absolute;width:1px;height:1px;background:#ddf;border-radius:50%;top:50%;left:15%;animation:sit-cat-twinkle 3s ease-in-out infinite 1.2s"></div><div style="position:absolute;width:2px;height:2px;background:#fff;border-radius:50%;top:85%;left:55%;box-shadow:0 0 3px #aaf"></div></div>' },
            { name: 'video-ambient-loop', label: 'Video Ambient Loop', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Enables subtle looping video backgrounds behind dashboard panels.', preview: 'background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);',
              previewHtml: '<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);display:flex;align-items:center;justify-content:center;position:relative"><div style="width:48px;height:32px;border:2px solid rgba(255,255,255,0.3);border-radius:4px;position:relative;display:flex;align-items:center;justify-content:center"><div style="width:0;height:0;border-left:12px solid rgba(255,255,255,0.5);border-top:7px solid transparent;border-bottom:7px solid transparent;margin-left:3px"></div></div><div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-size:7px;color:rgba(255,255,255,0.3);font-family:sans-serif">VIDEO BG</div></div>' },
            { name: 'aurora-borealis', label: 'Aurora Borealis', type: 'css', difficulty: 'beginner', cloud: true, description: 'Flowing northern lights effect with ethereal green and purple shifting lights.', preview: 'background: linear-gradient(180deg, #020111 0%, #031b34 40%, #0a3d2e 70%, #020111 100%);',
              previewHtml: '<div style="width:100%;height:100%;background:linear-gradient(180deg,#020111,#031b34,#0a3d2e,#020111);position:relative;overflow:hidden"><div style="position:absolute;width:200%;height:50%;bottom:20%;left:-50%;background:radial-gradient(ellipse,rgba(0,255,100,0.3),transparent);animation:sit-cat-aurora 6s ease-in-out infinite alternate;border-radius:50%"></div><div style="position:absolute;width:200%;height:40%;bottom:30%;left:-30%;background:radial-gradient(ellipse,rgba(100,0,255,0.15),transparent);animation:sit-cat-aurora 8s ease-in-out infinite alternate-reverse;border-radius:50%"></div></div>' },
            { name: 'radar-sweep', label: 'Radar Sweep', type: 'css', difficulty: 'beginner', cloud: true, description: 'Rotating radar sweep overlay with scanning beam effect for SOC dashboards.', preview: 'background: radial-gradient(circle, #001a00 0%, #000a00 50%, #000500 100%);',
              previewHtml: '<div style="width:100%;height:100%;background:radial-gradient(circle,#001a00,#000a00,#000500);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden"><div style="width:70px;height:70px;border-radius:50%;border:1px solid rgba(0,255,0,0.2);position:relative"><div style="position:absolute;width:50%;height:50%;top:0;left:50%;transform-origin:bottom left;background:linear-gradient(45deg,rgba(0,255,0,0.3),transparent);animation:sit-cat-radar 3s linear infinite;border-radius:0 100% 0 0"></div><div style="position:absolute;width:100%;height:100%;border-radius:50%;border:1px solid rgba(0,255,0,0.1)"></div><div style="position:absolute;width:60%;height:60%;top:20%;left:20%;border-radius:50%;border:1px solid rgba(0,255,0,0.08)"></div><div style="position:absolute;width:3px;height:3px;background:#0f0;border-radius:50%;top:25%;left:60%;box-shadow:0 0 4px #0f0"></div></div></div>' },
            { name: 'blueprint-technical', label: 'Blueprint Technical', type: 'css', difficulty: 'beginner', cloud: true, description: 'Engineering blueprint aesthetic with blue grid lines and technical drawing feel.', preview: 'background: #0a1628;',
              previewHtml: '<div style="width:100%;height:100%;background:#0a1628;background-image:linear-gradient(rgba(100,180,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(100,180,255,0.08) 1px,transparent 1px);background-size:12px 12px;position:relative;overflow:hidden"><div style="position:absolute;top:20%;left:15%;right:15%;height:50%;border:1px solid rgba(100,180,255,0.2);border-radius:2px"></div><div style="position:absolute;top:35%;left:25%;width:20px;height:20px;border:1px solid rgba(100,180,255,0.25);border-radius:50%"></div><div style="position:absolute;bottom:8px;right:8px;font-size:6px;color:rgba(100,180,255,0.3);font-family:monospace">REV.03</div></div>' },
            { name: 'dark-topography', label: 'Dark Topography', type: 'css', difficulty: 'beginner', cloud: true, description: 'Subtle topographic map contour lines on dark background.', preview: 'background: #1a1a2e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1a2e;position:relative;overflow:hidden"><svg viewBox="0 0 120 80" style="width:100%;height:100%;opacity:0.2"><path d="M0,60 Q30,50 60,55 T120,50" fill="none" stroke="#7c3aed" stroke-width="0.8"/><path d="M0,45 Q40,35 70,42 T120,38" fill="none" stroke="#7c3aed" stroke-width="0.8"/><path d="M0,32 Q35,25 65,30 T120,25" fill="none" stroke="#7c3aed" stroke-width="0.8"/><path d="M20,70 Q50,62 80,67 T120,63" fill="none" stroke="#7c3aed" stroke-width="0.8"/><ellipse cx="65" cy="38" rx="20" ry="10" fill="none" stroke="#7c3aed" stroke-width="0.6"/></svg></div>' },
            { name: 'circuit-board-trace', label: 'Circuit Board Trace', type: 'css', difficulty: 'beginner', cloud: true, description: 'Animated circuit board paths with glowing trace lines.', preview: 'background: #0a0f1a;',
              previewHtml: '<div style="width:100%;height:100%;background:#0a0f1a;position:relative;overflow:hidden"><svg viewBox="0 0 120 80" style="width:100%;height:100%"><path d="M10,20 L30,20 L30,40 L60,40 L60,20 L90,20" fill="none" stroke="rgba(0,255,200,0.2)" stroke-width="1.5"/><path d="M20,60 L50,60 L50,50 L80,50 L80,65 L110,65" fill="none" stroke="rgba(0,255,200,0.2)" stroke-width="1.5"/><circle cx="30" cy="20" r="2.5" fill="rgba(0,255,200,0.3)"/><circle cx="60" cy="40" r="2.5" fill="rgba(0,255,200,0.3)"/><circle cx="50" cy="60" r="2.5" fill="rgba(0,255,200,0.3)"/><circle cx="80" cy="50" r="2.5" fill="rgba(0,255,200,0.3)"/><circle cx="90" cy="20" r="3" fill="rgba(0,255,200,0.4)" style="animation:sit-cat-twinkle 2s ease-in-out infinite"/></svg></div>' },
            { name: 'noise-grain-texture', label: 'Noise Grain Texture', type: 'css', difficulty: 'beginner', cloud: true, description: 'Cinematic film grain overlay for a premium, textured look.', preview: 'background: #1a1a1a;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1a1a;position:relative;overflow:hidden"><div style="position:absolute;inset:0;opacity:0.15;background-image:url(\'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/></filter><rect width=\"100\" height=\"100\" filter=\"url(%23n)\" opacity=\"1\"/></svg>\');animation:sit-cat-grain 0.3s steps(4) infinite"></div><div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);font-size:8px;color:rgba(255,255,255,0.15);font-family:serif;letter-spacing:2px">FILM GRAIN</div></div>' }
        ],
        themes: [
            { name: 'soc-command-center', label: 'SOC Command Center', type: 'css', difficulty: 'beginner', cloud: true, description: 'Dark military NOC theme with red/orange accents and glowing borders.', preview: 'background: #0a0a0a; border: 1px solid rgba(255,60,30,0.3); box-shadow: inset 0 0 30px rgba(255,60,30,0.05);',
              previewHtml: '<div style="padding:8px;height:100%;background:#0a0a0a;font-family:sans-serif;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#e0e0e0;margin-bottom:6px">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:#111111;border:1px solid rgba(255,60,30,0.3);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#ff3c1e">1,247</div><div style="font-size:7px;color:#888">Events</div></div><div style="flex:1;background:#111111;border:1px solid rgba(255,60,30,0.3);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#ff3c1e">0.42%</div><div style="font-size:7px;color:#888">Errors</div></div></div><div style="background:#111111;border:1px solid rgba(255,60,30,0.3);border-radius:4px;padding:4px;height:40px"><div style="font-size:7px;color:#888;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#ff3c1e" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' },
            { name: 'executive-boardroom', label: 'Executive Boardroom', type: 'css', difficulty: 'beginner', cloud: true, description: 'Clean, minimal, premium typography. Looks like a $50K consulting deliverable.', preview: 'background: #fafafa; color: #2c2c2c; border: 1px solid #e8e8e8;',
              previewHtml: '<div style="padding:8px;height:100%;background:#fafafa;font-family:sans-serif;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#2c2c2c;margin-bottom:6px">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:#ffffff;border:1px solid #e2e8f0;border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#1a365d">1,247</div><div style="font-size:7px;color:#999">Events</div></div><div style="flex:1;background:#ffffff;border:1px solid #e2e8f0;border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#1a365d">0.42%</div><div style="font-size:7px;color:#999">Errors</div></div></div><div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:4px;padding:4px;height:40px"><div style="font-size:7px;color:#999;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#1a365d" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' },
            { name: 'cyberpunk-neon', label: 'Cyberpunk Neon', type: 'css', difficulty: 'beginner', cloud: true, description: 'Full neon aesthetic with hot pink/cyan on dark. Futuristic and bold.', preview: 'background: #0a0a1a; border: 1px solid rgba(0,255,255,0.3); box-shadow: 0 0 15px rgba(255,0,128,0.1);',
              previewHtml: '<div style="padding:8px;height:100%;background:#0a0a1a;font-family:sans-serif;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#e0e0ff;margin-bottom:6px">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:#0f0f2a;border:1px solid rgba(0,255,255,0.3);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#00ffff;text-shadow:0 0 6px rgba(0,255,255,0.4)">1,247</div><div style="font-size:7px;color:#8888cc">Events</div></div><div style="flex:1;background:#0f0f2a;border:1px solid rgba(0,255,255,0.3);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#00ffff;text-shadow:0 0 6px rgba(0,255,255,0.4)">0.42%</div><div style="font-size:7px;color:#8888cc">Errors</div></div></div><div style="background:#0f0f2a;border:1px solid rgba(0,255,255,0.3);border-radius:4px;padding:4px;height:40px"><div style="font-size:7px;color:#8888cc;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#00ffff" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' },
            { name: 'retro-terminal', label: 'Retro Terminal', type: 'css', difficulty: 'beginner', cloud: true, description: 'Green-on-black CRT terminal with scanlines and screen flicker.', preview: 'background: #0a0a0a; color: #00ff00; font-family: monospace; text-shadow: 0 0 5px rgba(0,255,0,0.5);',
              previewHtml: '<div style="padding:8px;height:100%;background:#0a0a0a;font-family:monospace;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#00ff00;margin-bottom:6px;text-shadow:0 0 4px rgba(0,255,0,0.4)">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:#0d0d0d;border:1px solid rgba(0,255,0,0.2);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#00ff00;text-shadow:0 0 6px rgba(0,255,0,0.5)">1,247</div><div style="font-size:7px;color:#00aa00">Events</div></div><div style="flex:1;background:#0d0d0d;border:1px solid rgba(0,255,0,0.2);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#00ff00;text-shadow:0 0 6px rgba(0,255,0,0.5)">0.42%</div><div style="font-size:7px;color:#00aa00">Errors</div></div></div><div style="background:#0d0d0d;border:1px solid rgba(0,255,0,0.2);border-radius:4px;padding:4px;height:40px"><div style="font-size:7px;color:#00aa00;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#00ff00" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' },
            { name: 'glass-dashboard', label: 'Glass Dashboard', type: 'css', difficulty: 'beginner', cloud: true, description: 'Transparent glassmorphism panels with backdrop blur and light refraction.', preview: 'background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);',
              previewHtml: '<div style="padding:8px;height:100%;background:#1a1a2e;font-family:sans-serif;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#ffffff;margin-bottom:6px">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:4px;text-align:center;backdrop-filter:blur(4px)"><div style="font-size:14px;font-weight:700;color:#7c3aed">1,247</div><div style="font-size:7px;color:#aaa">Events</div></div><div style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:4px;text-align:center;backdrop-filter:blur(4px)"><div style="font-size:14px;font-weight:700;color:#7c3aed">0.42%</div><div style="font-size:7px;color:#aaa">Errors</div></div></div><div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:4px;height:40px;backdrop-filter:blur(4px)"><div style="font-size:7px;color:#aaa;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#7c3aed" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' },
            { name: 'corporate-modern', label: 'Corporate Modern', type: 'css', difficulty: 'beginner', cloud: true, description: 'Clean shadows, rounded corners, professional blue palette. Modern SaaS feel.', preview: 'background: #f5f7fa; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);',
              previewHtml: '<div style="padding:8px;height:100%;background:#f5f7fa;font-family:sans-serif;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#1a202c;margin-bottom:6px">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:#ffffff;border:1px solid #e2e8f0;border-radius:4px;padding:4px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.06)"><div style="font-size:14px;font-weight:700;color:#3182ce">1,247</div><div style="font-size:7px;color:#999">Events</div></div><div style="flex:1;background:#ffffff;border:1px solid #e2e8f0;border-radius:4px;padding:4px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.06)"><div style="font-size:14px;font-weight:700;color:#3182ce">0.42%</div><div style="font-size:7px;color:#999">Errors</div></div></div><div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:4px;padding:4px;height:40px;box-shadow:0 1px 3px rgba(0,0,0,0.06)"><div style="font-size:7px;color:#999;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#3182ce" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' },
            { name: 'dark-mode-pro', label: 'Dark Mode Pro', type: 'css', difficulty: 'beginner', cloud: true, description: 'Properly designed dark theme with perfect contrast and subtle elevation.', preview: 'background: #1a1b1e; border: 1px solid #2a2b2e; box-shadow: 0 2px 8px rgba(0,0,0,0.3);',
              previewHtml: '<div style="padding:8px;height:100%;background:#1a1b1e;font-family:sans-serif;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#e4e4e7;margin-bottom:6px">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:#222326;border:1px solid #2a2b2e;border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#818cf8">1,247</div><div style="font-size:7px;color:#888">Events</div></div><div style="flex:1;background:#222326;border:1px solid #2a2b2e;border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#818cf8">0.42%</div><div style="font-size:7px;color:#888">Errors</div></div></div><div style="background:#222326;border:1px solid #2a2b2e;border-radius:4px;padding:4px;height:40px"><div style="font-size:7px;color:#888;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#818cf8" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' },
            { name: 'gradient-luxury', label: 'Gradient Luxury', type: 'css', difficulty: 'beginner', cloud: true, description: 'Subtle gradients with gold/amber accents. Premium luxury brand feel.', preview: 'background: linear-gradient(135deg, #1a1a2e 0%, #1e1428 100%); border: 1px solid rgba(212,175,55,0.2);',
              previewHtml: '<div style="padding:8px;height:100%;background:linear-gradient(135deg,#1a1a2e,#1e1428);font-family:sans-serif;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#f0e6d3;margin-bottom:6px">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:#1e1428;border:1px solid rgba(212,175,55,0.2);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#d4af37">1,247</div><div style="font-size:7px;color:#a89070">Events</div></div><div style="flex:1;background:#1e1428;border:1px solid rgba(212,175,55,0.2);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#d4af37">0.42%</div><div style="font-size:7px;color:#a89070">Errors</div></div></div><div style="background:#1e1428;border:1px solid rgba(212,175,55,0.2);border-radius:4px;padding:4px;height:40px"><div style="font-size:7px;color:#a89070;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#d4af37" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' },
            { name: 'newspaper-editorial', label: 'Newspaper Editorial', type: 'css', difficulty: 'beginner', cloud: true, description: 'Clean editorial typography layout. Premium data journalism aesthetic.', preview: 'background: #f8f5f0; color: #2c2c2c; font-family: Georgia, serif; border-bottom: 2px solid #2c2c2c;',
              previewHtml: '<div style="padding:8px;height:100%;background:#f8f5f0;font-family:Georgia,serif;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#2c2c2c;margin-bottom:6px;border-bottom:1px solid #2c2c2c;padding-bottom:3px">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:#ffffff;border:1px solid #e8e4de;border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#c41e3a">1,247</div><div style="font-size:7px;color:#888">Events</div></div><div style="flex:1;background:#ffffff;border:1px solid #e8e4de;border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#c41e3a">0.42%</div><div style="font-size:7px;color:#888">Errors</div></div></div><div style="background:#ffffff;border:1px solid #e8e4de;border-radius:4px;padding:4px;height:40px"><div style="font-size:7px;color:#888;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#c41e3a" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' },
            { name: 'synthwave-sunset', label: 'Synthwave Sunset', type: 'css', difficulty: 'beginner', cloud: true, description: '80s retro synthwave with purple/pink sunset gradient and chrome effects.', preview: 'background: linear-gradient(180deg, #2b1055 0%, #d53369 100%);',
              previewHtml: '<div style="padding:8px;height:100%;background:#1a0533;font-family:sans-serif;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#f0d0ff;margin-bottom:6px">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:#2b1055;border:1px solid rgba(255,110,199,0.2);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#ff6ec7;text-shadow:0 0 6px rgba(255,110,199,0.4)">1,247</div><div style="font-size:7px;color:#bb88dd">Events</div></div><div style="flex:1;background:#2b1055;border:1px solid rgba(255,110,199,0.2);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#ff6ec7;text-shadow:0 0 6px rgba(255,110,199,0.4)">0.42%</div><div style="font-size:7px;color:#bb88dd">Errors</div></div></div><div style="background:#2b1055;border:1px solid rgba(255,110,199,0.2);border-radius:4px;padding:4px;height:40px"><div style="font-size:7px;color:#bb88dd;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#ff6ec7" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' },
            { name: 'arctic-frost', label: 'Arctic Frost', type: 'css', difficulty: 'beginner', cloud: true, description: 'Cool blues, frosted glass, crystalline borders. Crisp winter aesthetic.', preview: 'background: #0a1628; border: 1px solid rgba(100,180,255,0.2); box-shadow: 0 0 20px rgba(100,180,255,0.05);',
              previewHtml: '<div style="padding:8px;height:100%;background:#0a1628;font-family:sans-serif;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#d0e8ff;margin-bottom:6px">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:#0f1d32;border:1px solid rgba(100,180,255,0.2);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#64b4ff">1,247</div><div style="font-size:7px;color:#6688aa">Events</div></div><div style="flex:1;background:#0f1d32;border:1px solid rgba(100,180,255,0.2);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#64b4ff">0.42%</div><div style="font-size:7px;color:#6688aa">Errors</div></div></div><div style="background:#0f1d32;border:1px solid rgba(100,180,255,0.2);border-radius:4px;padding:4px;height:40px"><div style="font-size:7px;color:#6688aa;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#64b4ff" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' },
            { name: 'splunk-innovator-signature', label: 'Innovator Signature', type: 'css', difficulty: 'beginner', cloud: true, description: 'The official Splunk Innovators Network branded theme with signature pink.', preview: 'background: #111215; border: 1px solid rgba(253,24,117,0.2); box-shadow: 0 0 20px rgba(253,24,117,0.05);',
              previewHtml: '<div style="padding:8px;height:100%;background:#111215;font-family:sans-serif;box-sizing:border-box"><div style="font-size:9px;font-weight:700;color:#ffffff;margin-bottom:6px">Dashboard Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;background:#1a1b1e;border:1px solid rgba(253,24,117,0.2);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#FD1875">1,247</div><div style="font-size:7px;color:#888">Events</div></div><div style="flex:1;background:#1a1b1e;border:1px solid rgba(253,24,117,0.2);border-radius:4px;padding:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#FD1875">0.42%</div><div style="font-size:7px;color:#888">Errors</div></div></div><div style="background:#1a1b1e;border:1px solid rgba(253,24,117,0.2);border-radius:4px;padding:4px;height:40px"><div style="font-size:7px;color:#888;margin-bottom:2px">Chart</div><svg viewBox="0 0 100 25" style="width:100%;height:20px"><polyline fill="none" stroke="#FD1875" stroke-width="1.5" points="0,20 15,15 30,18 45,8 60,12 75,5 90,8 100,3"/></svg></div></div>' }
        ],
        widgets: [
            { name: 'kpi-glassmorphism', label: 'KPI Glassmorphism', type: 'css', difficulty: 'beginner', cloud: true, description: 'Frosted glass KPI cards with backdrop blur and light refraction.', preview: 'background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;',
              previewHtml: '<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e,#2a1a4e);display:flex;align-items:center;justify-content:center"><div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:10px 18px;text-align:center"><div style="font-size:22px;font-weight:700;color:#fff;font-family:sans-serif">2,847</div><div style="font-size:8px;color:rgba(255,255,255,0.6);font-family:sans-serif;margin-top:2px">Total Events</div></div></div>' },
            { name: 'kpi-neon-glow', label: 'KPI Neon Glow', type: 'css', difficulty: 'beginner', cloud: true, description: 'Neon glowing borders and text effects on single-value panels.', preview: 'border: 1px solid rgba(0,255,255,0.5); box-shadow: 0 0 15px rgba(0,255,255,0.2), inset 0 0 15px rgba(0,255,255,0.05); border-radius: 12px;',
              previewHtml: '<div style="width:100%;height:100%;background:#0a0a1a;display:flex;align-items:center;justify-content:center"><div style="border:1px solid rgba(0,255,255,0.5);box-shadow:0 0 15px rgba(0,255,255,0.3),inset 0 0 15px rgba(0,255,255,0.05);border-radius:12px;padding:10px 18px;text-align:center;animation:sit-cat-neon-glow 2s ease-in-out infinite alternate"><div style="font-size:22px;font-weight:700;color:#00ffff;font-family:sans-serif;text-shadow:0 0 10px rgba(0,255,255,0.5)">99.9%</div><div style="font-size:8px;color:rgba(0,255,255,0.6);font-family:sans-serif;margin-top:2px">Uptime</div></div></div>' },
            { name: 'kpi-3d-flip', label: 'KPI 3D Flip', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Cards that flip 3D to show detail on hover.', preview: 'background: linear-gradient(135deg, #1e293b, #334155); border-radius: 12px; transform: perspective(500px);',
              previewHtml: '<div style="width:100%;height:100%;background:#1e293b;display:flex;align-items:center;justify-content:center;perspective:300px"><div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:10px;padding:10px 16px;text-align:center;animation:sit-cat-flip 4s ease-in-out infinite;transform-style:preserve-3d"><div style="font-size:20px;font-weight:700;color:#fff;font-family:sans-serif">523</div><div style="font-size:8px;color:#94a3b8;font-family:sans-serif">Hover to Flip</div></div></div>' },
            { name: 'kpi-animated-counter', label: 'KPI Animated Counter', type: 'js', difficulty: 'beginner', cloud: true, description: 'Numbers roll up from 0 to actual value on load.', preview: 'background: #1a1b1e; font-size: 32px; font-weight: bold;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;font-family:sans-serif"><div style="text-align:center"><div style="font-size:28px;font-weight:700;color:#818cf8;font-variant-numeric:tabular-nums">8,192</div><div style="font-size:8px;color:#888;margin-top:2px">Counting Up...</div><div style="width:40px;height:2px;background:linear-gradient(90deg,#818cf8,transparent);margin:4px auto 0;animation:sit-cat-counter-bar 2s ease-out infinite"></div></div></div>' },
            { name: 'kpi-circular-progress', label: 'KPI Circular Progress', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Donut-style circular progress rings around KPI values.', preview: 'background: #1a1b1e; border-radius: 50%;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" fill="none" stroke="#2a2b2e" stroke-width="5"/><circle cx="30" cy="30" r="24" fill="none" stroke="#FD1875" stroke-width="5" stroke-dasharray="113" stroke-dashoffset="30" stroke-linecap="round" transform="rotate(-90 30 30)" style="animation:sit-cat-progress 3s ease-in-out infinite alternate"/><text x="30" y="33" text-anchor="middle" fill="#fff" font-size="13" font-weight="700" font-family="sans-serif">78%</text></svg></div>' },
            { name: 'status-traffic-lights', label: 'Status Traffic Lights', type: 'css', difficulty: 'beginner', cloud: true, description: 'Glowing red/yellow/green traffic light status indicators.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:12px"><div style="width:18px;height:18px;border-radius:50%;background:#ff4444;box-shadow:0 0 10px rgba(255,68,68,0.5),0 0 20px rgba(255,68,68,0.2)"></div><div style="width:18px;height:18px;border-radius:50%;background:#ffbb33;box-shadow:0 0 10px rgba(255,187,51,0.5),0 0 20px rgba(255,187,51,0.2)"></div><div style="width:18px;height:18px;border-radius:50%;background:#44ff44;box-shadow:0 0 10px rgba(68,255,68,0.5),0 0 20px rgba(68,255,68,0.2);animation:sit-cat-twinkle 2s ease-in-out infinite"></div></div>' },
            { name: 'sparkline-inline', label: 'Sparkline Inline', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Tiny inline SVG trend charts below KPI numbers.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;font-family:sans-serif"><div style="text-align:center"><div style="font-size:22px;font-weight:700;color:#5CC05C">4,217</div><svg viewBox="0 0 60 20" style="width:60px;height:18px;margin-top:2px"><polyline fill="none" stroke="#5CC05C" stroke-width="1.5" points="0,15 8,12 16,14 24,8 32,10 40,5 48,7 60,3"/><polyline fill="rgba(92,192,92,0.1)" stroke="none" points="0,20 0,15 8,12 16,14 24,8 32,10 40,5 48,7 60,3 60,20"/></svg></div></div>' },
            { name: 'gauge-liquid-fill', label: 'Gauge Liquid Fill', type: 'js', difficulty: 'advanced', cloud: true, description: 'Animated liquid fill gauge with wave motion surface.', preview: 'background: #1a1b1e; border-radius: 50%;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><div style="width:56px;height:56px;border-radius:50%;border:2px solid #3182ce;position:relative;overflow:hidden"><div style="position:absolute;bottom:0;left:-10%;width:120%;height:65%;background:#3182ce;border-radius:0 0 50% 50%;opacity:0.3"></div><div style="position:absolute;bottom:0;left:-20%;width:140%;height:60%;background:rgba(49,130,206,0.6);animation:sit-cat-wave 3s ease-in-out infinite;border-radius:40%"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;font-family:sans-serif">65%</div></div></div>' },
            { name: 'gauge-speedometer', label: 'Gauge Speedometer', type: 'js', difficulty: 'advanced', cloud: true, description: 'Real speedometer-style gauge with animated needle.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><svg width="70" height="45" viewBox="0 0 70 45"><path d="M8,40 A30,30 0 0,1 62,40" fill="none" stroke="#2a2b2e" stroke-width="5" stroke-linecap="round"/><path d="M8,40 A30,30 0 0,1 45,12" fill="none" stroke="#FD1875" stroke-width="5" stroke-linecap="round"/><line x1="35" y1="38" x2="22" y2="18" stroke="#fff" stroke-width="1.5" stroke-linecap="round" style="transform-origin:35px 38px;animation:sit-cat-needle 3s ease-in-out infinite alternate"/><circle cx="35" cy="38" r="3" fill="#fff"/><text x="35" y="44" text-anchor="middle" fill="#888" font-size="6" font-family="sans-serif">72 mph</text></svg></div>' },
            { name: 'alert-toast-notifications', label: 'Alert Toast Notifications', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Slide-in toast notifications triggered by search results.', preview: 'background: #1a2f1a; border-left: 4px solid #5CC05C; border-radius: 8px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:6px 8px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;gap:4px;font-family:sans-serif"><div style="background:#1a2f1a;border-left:3px solid #5CC05C;border-radius:4px;padding:4px 6px;font-size:8px;color:#5CC05C">Success: Deploy complete</div><div style="background:#2f1a1a;border-left:3px solid #ff4444;border-radius:4px;padding:4px 6px;font-size:8px;color:#ff4444">Error: Connection lost</div><div style="background:#2f2a1a;border-left:3px solid #ffbb33;border-radius:4px;padding:4px 6px;font-size:8px;color:#ffbb33">Warning: High CPU</div></div>' },
            { name: 'countdown-timer', label: 'Countdown Timer', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Live countdown timer to a target datetime with flip-clock animation.', preview: 'background: #1a1b1e; font-family: monospace; font-size: 24px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:4px;font-family:monospace"><div style="background:#222326;border-radius:4px;padding:4px 6px;text-align:center"><div style="font-size:18px;font-weight:700;color:#fff">12</div><div style="font-size:6px;color:#666">HRS</div></div><div style="font-size:16px;color:#FD1875;font-weight:700">:</div><div style="background:#222326;border-radius:4px;padding:4px 6px;text-align:center"><div style="font-size:18px;font-weight:700;color:#fff">34</div><div style="font-size:6px;color:#666">MIN</div></div><div style="font-size:16px;color:#FD1875;font-weight:700">:</div><div style="background:#222326;border-radius:4px;padding:4px 6px;text-align:center"><div style="font-size:18px;font-weight:700;color:#FD1875;animation:sit-cat-twinkle 1s step-end infinite">56</div><div style="font-size:6px;color:#666">SEC</div></div></div>' },
            { name: 'real-time-clock', label: 'Real-Time Clock', type: 'js', difficulty: 'beginner', cloud: true, description: 'World clock widget with timezone support for NOC boards.', preview: 'background: #1a1b1e; font-family: monospace;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;font-family:monospace"><div style="text-align:center"><div style="font-size:8px;color:#666;margin-bottom:2px">UTC-5 Eastern</div><div style="font-size:24px;font-weight:700;color:#64b4ff;letter-spacing:2px">14:32</div><div style="font-size:7px;color:#888;margin-top:2px;animation:sit-cat-twinkle 1s step-end infinite">:47</div></div></div>' },
            { name: 'weather-widget', label: 'Weather Widget', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Animated weather display with CSS-only weather effects.', preview: 'background: linear-gradient(180deg, #1a3a5c, #2a4a6c);',
              previewHtml: '<div style="width:100%;height:100%;background:linear-gradient(180deg,#1a3a5c,#2a4a6c);display:flex;align-items:center;justify-content:center;gap:10px;font-family:sans-serif"><div style="font-size:30px;animation:sit-cat-sun 4s ease-in-out infinite">&#9728;</div><div><div style="font-size:22px;font-weight:700;color:#fff">72&deg;F</div><div style="font-size:8px;color:rgba(255,255,255,0.6)">Partly Cloudy</div></div></div>' },
            { name: 'team-status-board', label: 'Team Status Board', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Team/on-call status board with availability indicators.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:8px;box-sizing:border-box;font-family:sans-serif"><div style="font-size:8px;color:#888;margin-bottom:6px">On-Call Team</div><div style="display:flex;gap:6px;align-items:center;margin-bottom:5px"><div style="width:20px;height:20px;border-radius:50%;background:#3182ce;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;font-weight:700;position:relative">A<div style="position:absolute;bottom:-1px;right:-1px;width:7px;height:7px;border-radius:50%;background:#44ff44;border:1.5px solid #1a1b1e"></div></div><div style="width:20px;height:20px;border-radius:50%;background:#e53e3e;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;font-weight:700;position:relative">B<div style="position:absolute;bottom:-1px;right:-1px;width:7px;height:7px;border-radius:50%;background:#ffbb33;border:1.5px solid #1a1b1e"></div></div><div style="width:20px;height:20px;border-radius:50%;background:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;font-weight:700;position:relative">C<div style="position:absolute;bottom:-1px;right:-1px;width:7px;height:7px;border-radius:50%;background:#44ff44;border:1.5px solid #1a1b1e"></div></div></div><div style="font-size:7px;color:#5CC05C">2 online, 1 busy</div></div>' },
            { name: 'loading-skeleton', label: 'Loading Skeleton', type: 'css', difficulty: 'beginner', cloud: true, description: 'Shimmer skeleton placeholders instead of default loading spinners.', preview: 'background: linear-gradient(90deg, #1a1b1e 25%, #2a2b2e 50%, #1a1b1e 75%); background-size: 200% 100%; animation: sit-cat-shimmer 1.5s infinite;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:10px;box-sizing:border-box;display:flex;flex-direction:column;gap:6px"><div style="height:10px;border-radius:4px;background:linear-gradient(90deg,#2a2b2e 25%,#3a3b3e 50%,#2a2b2e 75%);background-size:200% 100%;animation:sit-cat-shimmer 1.5s infinite;width:60%"></div><div style="height:8px;border-radius:4px;background:linear-gradient(90deg,#2a2b2e 25%,#3a3b3e 50%,#2a2b2e 75%);background-size:200% 100%;animation:sit-cat-shimmer 1.5s infinite 0.1s;width:90%"></div><div style="height:8px;border-radius:4px;background:linear-gradient(90deg,#2a2b2e 25%,#3a3b3e 50%,#2a2b2e 75%);background-size:200% 100%;animation:sit-cat-shimmer 1.5s infinite 0.2s;width:75%"></div><div style="height:20px;border-radius:6px;background:linear-gradient(90deg,#2a2b2e 25%,#3a3b3e 50%,#2a2b2e 75%);background-size:200% 100%;animation:sit-cat-shimmer 1.5s infinite 0.3s;width:100%"></div></div>' },
            { name: 'confetti-celebration', label: 'Confetti Celebration', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Confetti burst when KPI crosses a threshold.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center"><div style="position:absolute;width:6px;height:6px;background:#FD1875;top:10%;left:20%;border-radius:1px;animation:sit-cat-confetti 2s ease-out infinite;transform:rotate(45deg)"></div><div style="position:absolute;width:5px;height:5px;background:#00ffff;top:5%;left:50%;border-radius:1px;animation:sit-cat-confetti 2.2s ease-out infinite 0.3s;transform:rotate(20deg)"></div><div style="position:absolute;width:6px;height:4px;background:#ffbb33;top:8%;left:75%;border-radius:1px;animation:sit-cat-confetti 1.8s ease-out infinite 0.6s;transform:rotate(60deg)"></div><div style="position:absolute;width:4px;height:6px;background:#5CC05C;top:3%;left:35%;border-radius:1px;animation:sit-cat-confetti 2.5s ease-out infinite 0.1s;transform:rotate(10deg)"></div><div style="position:absolute;width:5px;height:5px;background:#7c3aed;top:6%;left:60%;border-radius:1px;animation:sit-cat-confetti 2s ease-out infinite 0.5s;transform:rotate(30deg)"></div><div style="font-size:18px;font-weight:700;color:#fff;font-family:sans-serif;z-index:1">&#127881; Goal Hit!</div></div>' },
            { name: 'news-ticker-scroll', label: 'News Ticker Scroll', type: 'css', difficulty: 'beginner', cloud: true, description: 'Scrolling horizontal ticker bar for events and alerts.', preview: 'background: #0a0a1a; border-top: 1px solid rgba(253,24,117,0.3);',
              previewHtml: '<div style="width:100%;height:100%;background:#0a0a1a;display:flex;align-items:center;overflow:hidden;position:relative"><div style="position:absolute;top:0;left:0;right:0;height:1px;background:rgba(253,24,117,0.3)"></div><div style="white-space:nowrap;animation:sit-cat-ticker 8s linear infinite;font-size:9px;color:#FD1875;font-family:sans-serif"><span style="margin-right:30px">&#9679; Alert: CPU threshold exceeded on host-04</span><span style="margin-right:30px">&#9679; Info: Deployment v2.4.1 complete</span><span style="margin-right:30px">&#9679; Warning: Disk usage at 89%</span></div></div>' },
            { name: 'qr-code-generator', label: 'QR Code Generator', type: 'js', difficulty: 'beginner', cloud: true, description: 'QR code for sharing dashboard links on mobile.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 50 50" width="55" height="55"><rect x="2" y="2" width="12" height="12" rx="1" fill="#fff"/><rect x="4" y="4" width="8" height="8" rx="0.5" fill="#1a1b1e"/><rect x="5.5" y="5.5" width="5" height="5" fill="#fff"/><rect x="36" y="2" width="12" height="12" rx="1" fill="#fff"/><rect x="38" y="4" width="8" height="8" rx="0.5" fill="#1a1b1e"/><rect x="39.5" y="5.5" width="5" height="5" fill="#fff"/><rect x="2" y="36" width="12" height="12" rx="1" fill="#fff"/><rect x="4" y="38" width="8" height="8" rx="0.5" fill="#1a1b1e"/><rect x="5.5" y="39.5" width="5" height="5" fill="#fff"/><rect x="17" y="2" width="3" height="3" fill="#fff"/><rect x="22" y="5" width="3" height="3" fill="#fff"/><rect x="17" y="10" width="3" height="3" fill="#fff"/><rect x="27" y="2" width="3" height="3" fill="#fff"/><rect x="20" y="17" width="3" height="3" fill="#fff"/><rect x="25" y="20" width="3" height="3" fill="#fff"/><rect x="17" y="25" width="3" height="3" fill="#fff"/><rect x="30" y="17" width="3" height="3" fill="#fff"/><rect x="35" y="25" width="3" height="3" fill="#fff"/><rect x="40" y="20" width="3" height="3" fill="#fff"/><rect x="20" y="35" width="3" height="3" fill="#fff"/><rect x="25" y="40" width="3" height="3" fill="#fff"/><rect x="35" y="35" width="3" height="3" fill="#fff"/><rect x="40" y="40" width="3" height="3" fill="#fff"/><rect x="45" y="35" width="3" height="3" fill="#fff"/></svg></div>' }
        ],
        toggles: [
            { name: 'dark-light-mode', label: 'Dark/Light Mode', type: 'js', difficulty: 'beginner', cloud: true, description: 'Toggle between dark and light dashboard themes with smooth transition.', preview: 'background: linear-gradient(135deg, #1a1b1e 50%, #f5f5f5 50%);',
              previewHtml: '<div style="width:100%;height:100%;display:flex;overflow:hidden"><div style="flex:1;background:#1a1b1e;display:flex;align-items:center;justify-content:center;font-size:18px">&#127769;</div><div style="flex:1;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:18px">&#9728;&#65039;</div></div>' },
            { name: 'panel-collapse-accordion', label: 'Panel Collapse', type: 'js', difficulty: 'beginner', cloud: true, description: 'Click panel headers to collapse/expand with smooth animation.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:8px;box-sizing:border-box;display:flex;flex-direction:column;gap:3px;font-family:sans-serif"><div style="background:#222326;border-radius:4px;padding:5px 8px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:8px;color:#fff">Section A</span><span style="font-size:10px;color:#888;transform:rotate(180deg);display:inline-block">&#9660;</span></div><div style="background:#2a2b2e;border-radius:0 0 4px 4px;padding:4px 8px;font-size:7px;color:#888;margin-top:-3px">Expanded content here...</div><div style="background:#222326;border-radius:4px;padding:5px 8px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:8px;color:#fff">Section B</span><span style="font-size:10px;color:#888">&#9660;</span></div><div style="background:#222326;border-radius:4px;padding:5px 8px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:8px;color:#fff">Section C</span><span style="font-size:10px;color:#888">&#9660;</span></div></div>' },
            { name: 'filter-chips-tags', label: 'Filter Chips', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Convert dropdown filters into modern tag-style chip pills.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;padding:8px;box-sizing:border-box"><span style="background:rgba(253,24,117,0.15);color:#FD1875;border-radius:999px;padding:3px 8px;font-size:8px;font-family:sans-serif;font-weight:600">Critical</span><span style="background:rgba(49,130,206,0.15);color:#3182ce;border-radius:999px;padding:3px 8px;font-size:8px;font-family:sans-serif;font-weight:600">Network</span><span style="background:rgba(92,192,92,0.15);color:#5CC05C;border-radius:999px;padding:3px 8px;font-size:8px;font-family:sans-serif;font-weight:600">Resolved</span><span style="background:rgba(255,187,51,0.15);color:#ffbb33;border-radius:999px;padding:3px 8px;font-size:8px;font-family:sans-serif;font-weight:600">Pending</span></div>' },
            { name: 'tab-navigation', label: 'Tab Navigation', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Convert dashboard rows into tabbed sections with animated transitions.', preview: 'background: #1a1b1e; border-bottom: 2px solid #FD1875;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:10px 8px 0;box-sizing:border-box;font-family:sans-serif"><div style="display:flex;gap:0;border-bottom:1px solid #2a2b2e"><div style="padding:4px 8px;font-size:8px;color:#FD1875;border-bottom:2px solid #FD1875;font-weight:600">Overview</div><div style="padding:4px 8px;font-size:8px;color:#888">Details</div><div style="padding:4px 8px;font-size:8px;color:#888">Alerts</div></div><div style="padding:8px 4px;font-size:7px;color:#aaa">Tab content area...</div></div>' },
            { name: 'sidebar-slide-panel', label: 'Sidebar Panel', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Slide-out sidebar with navigation links and filters.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#222326;display:flex;overflow:hidden"><div style="width:35%;background:#1a1b1e;border-right:1px solid #2a2b2e;padding:8px 6px;box-sizing:border-box;display:flex;flex-direction:column;gap:4px;font-family:sans-serif"><div style="font-size:7px;color:#FD1875;font-weight:700;margin-bottom:2px">Navigation</div><div style="font-size:7px;color:#fff;padding:2px 4px;background:rgba(253,24,117,0.15);border-radius:3px">Dashboard</div><div style="font-size:7px;color:#888;padding:2px 4px">Reports</div><div style="font-size:7px;color:#888;padding:2px 4px">Settings</div></div><div style="flex:1;padding:8px;font-size:7px;color:#666;font-family:sans-serif">Main content</div></div>' },
            { name: 'fullscreen-mode', label: 'Fullscreen Mode', type: 'js', difficulty: 'beginner', cloud: true, description: 'One-click fullscreen mode that hides Splunk navigation chrome.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><div style="border:2px solid #888;border-radius:4px;width:44px;height:32px;position:relative;display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FD1875" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg></div></div>' },
            { name: 'panel-zoom-focus', label: 'Panel Zoom Focus', type: 'js', difficulty: 'beginner', cloud: true, description: 'Click any panel to zoom it fullscreen. Click again to return.', preview: 'background: #1a1b1e; transform: scale(1.02); box-shadow: 0 8px 32px rgba(0,0,0,0.4);',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:6px"><div style="width:32px;height:28px;background:#222326;border:1px solid #2a2b2e;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:7px;color:#888;font-family:sans-serif;opacity:0.5">Panel</div><div style="width:40px;height:36px;background:#222326;border:1px solid #FD1875;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:8px;color:#FD1875;font-family:sans-serif;box-shadow:0 4px 16px rgba(253,24,117,0.2);transform:scale(1.1)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FD1875" stroke-width="2"><circle cx="11" cy="11" r="6"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div><div style="width:32px;height:28px;background:#222326;border:1px solid #2a2b2e;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:7px;color:#888;font-family:sans-serif;opacity:0.5">Panel</div></div>' },
            { name: 'drag-resize-panels', label: 'Drag Resize Panels', type: 'js', difficulty: 'advanced', cloud: true, description: 'Drag panel borders to resize widths. Saves layout to localStorage.', preview: 'background: #1a1b1e; cursor: col-resize;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:stretch;font-family:sans-serif"><div style="flex:2;background:#222326;border-radius:4px 0 0 4px;margin:8px 0 8px 8px;display:flex;align-items:center;justify-content:center;font-size:7px;color:#888">Wide Panel</div><div style="width:6px;background:#2a2b2e;display:flex;align-items:center;justify-content:center;cursor:col-resize"><div style="width:2px;height:16px;background:#FD1875;border-radius:1px"></div></div><div style="flex:1;background:#222326;border-radius:0 4px 4px 0;margin:8px 8px 8px 0;display:flex;align-items:center;justify-content:center;font-size:7px;color:#888">Narrow</div></div>' },
            { name: 'right-click-context-menu', label: 'Context Menu', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Custom right-click menu with zoom, export, refresh options.', preview: 'background: #2a2b2e; border: 1px solid #3a3b3e; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><div style="background:#2a2b2e;border:1px solid #3a3b3e;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,0.5);padding:4px 0;font-family:sans-serif;min-width:80px"><div style="padding:3px 10px;font-size:8px;color:#fff;cursor:pointer">&#128269; Zoom</div><div style="padding:3px 10px;font-size:8px;color:#fff;cursor:pointer;background:rgba(253,24,117,0.1)">&#128190; Export</div><div style="padding:3px 10px;font-size:8px;color:#fff;cursor:pointer">&#128260; Refresh</div><div style="height:1px;background:#3a3b3e;margin:2px 0"></div><div style="padding:3px 10px;font-size:8px;color:#ff4444;cursor:pointer">&#128465; Delete</div></div></div>' },
            { name: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', type: 'js', difficulty: 'beginner', cloud: true, description: 'Navigate dashboards with keyboard. Arrow keys, Enter to zoom, ? for help.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:4px;font-family:sans-serif"><div style="background:#2a2b2e;border:1px solid #3a3b3e;border-radius:4px;padding:4px 7px;font-size:10px;color:#fff;box-shadow:0 2px 0 #111;font-weight:700">&#8593;</div><div style="display:flex;flex-direction:column;gap:4px"><div style="display:flex;gap:4px"><div style="background:#2a2b2e;border:1px solid #3a3b3e;border-radius:4px;padding:4px 7px;font-size:10px;color:#fff;box-shadow:0 2px 0 #111;font-weight:700">&#8592;</div><div style="background:#2a2b2e;border:1px solid #3a3b3e;border-radius:4px;padding:4px 7px;font-size:10px;color:#fff;box-shadow:0 2px 0 #111;font-weight:700">&#8595;</div><div style="background:#2a2b2e;border:1px solid #3a3b3e;border-radius:4px;padding:4px 7px;font-size:10px;color:#fff;box-shadow:0 2px 0 #111;font-weight:700">&#8594;</div></div></div><div style="background:#2a2b2e;border:1px solid #FD1875;border-radius:4px;padding:4px 7px;font-size:10px;color:#FD1875;box-shadow:0 2px 0 #111;font-weight:700;margin-left:6px">?</div></div>' },
            { name: 'auto-refresh-countdown', label: 'Auto-Refresh Countdown', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Visual countdown ring showing when next auto-refresh happens.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="22" fill="none" stroke="#2a2b2e" stroke-width="3"/><circle cx="28" cy="28" r="22" fill="none" stroke="#FD1875" stroke-width="3" stroke-dasharray="138" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 28 28)" style="animation:sit-cat-countdown 5s linear infinite"/><text x="28" y="26" text-anchor="middle" fill="#fff" font-size="10" font-weight="700" font-family="sans-serif">30s</text><text x="28" y="34" text-anchor="middle" fill="#888" font-size="6" font-family="sans-serif">refresh</text></svg></div>' },
            { name: 'user-preferences-persist', label: 'User Preferences', type: 'js', difficulty: 'beginner', cloud: true, description: 'Saves user choices (dark mode, collapsed panels, etc.) to localStorage.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;font-family:sans-serif"><div style="text-align:left"><div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span style="font-size:9px;color:#fff;font-weight:600">Settings</span></div><div style="display:flex;align-items:center;gap:4px;margin-bottom:3px"><div style="width:8px;height:8px;border:1.5px solid #5CC05C;border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:6px;color:#5CC05C">&#10003;</div><span style="font-size:7px;color:#aaa">Dark Mode</span></div><div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border:1.5px solid #5CC05C;border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:6px;color:#5CC05C">&#10003;</div><span style="font-size:7px;color:#aaa">Auto-Refresh</span></div></div></div>' }
        ],
        animations: [
            { name: 'panel-entrance-fade', label: 'Panel Fade In', type: 'css', difficulty: 'beginner', cloud: true, description: 'Panels fade in sequentially on dashboard load.', preview: 'opacity: 0.3;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;box-sizing:border-box"><div style="flex:1;height:40px;background:#222326;border-radius:4px;animation:sit-cat-fadein 2s ease-out infinite;opacity:0"></div><div style="flex:1;height:40px;background:#222326;border-radius:4px;animation:sit-cat-fadein 2s ease-out infinite 0.3s;opacity:0"></div><div style="flex:1;height:40px;background:#222326;border-radius:4px;animation:sit-cat-fadein 2s ease-out infinite 0.6s;opacity:0"></div></div>' },
            { name: 'panel-entrance-slide', label: 'Panel Slide Up', type: 'css', difficulty: 'beginner', cloud: true, description: 'Panels slide up into position with staggered timing.', preview: 'transform: translateY(10px); opacity: 0.3;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;box-sizing:border-box"><div style="flex:1;height:40px;background:#222326;border-radius:4px;animation:sit-cat-slideup 2s ease-out infinite"></div><div style="flex:1;height:40px;background:#222326;border-radius:4px;animation:sit-cat-slideup 2s ease-out infinite 0.2s"></div><div style="flex:1;height:40px;background:#222326;border-radius:4px;animation:sit-cat-slideup 2s ease-out infinite 0.4s"></div></div>' },
            { name: 'hover-scale-lift', label: 'Hover Scale Lift', type: 'css', difficulty: 'beginner', cloud: true, description: 'Panels scale up and gain shadow on hover.', preview: 'transform: scale(1.02); box-shadow: 0 8px 24px rgba(0,0,0,0.3);',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><div style="width:60px;height:40px;background:#222326;border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,0.4);transform:scale(1.05);display:flex;align-items:center;justify-content:center;font-size:7px;color:#888;font-family:sans-serif;animation:sit-cat-lift 2s ease-in-out infinite">Hover Me</div></div>' },
            { name: 'hover-glow-border', label: 'Hover Glow Border', type: 'css', difficulty: 'beginner', cloud: true, description: 'Panels get a glowing colored border on hover.', preview: 'box-shadow: 0 0 15px rgba(253,24,117,0.3); border: 1px solid rgba(253,24,117,0.4);',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><div style="width:60px;height:40px;background:#222326;border-radius:6px;border:1px solid rgba(253,24,117,0.5);box-shadow:0 0 15px rgba(253,24,117,0.3);animation:sit-cat-glow-border 2s ease-in-out infinite alternate;display:flex;align-items:center;justify-content:center;font-size:7px;color:#FD1875;font-family:sans-serif">Glow</div></div>' },
            { name: 'button-ripple-effect', label: 'Button Ripple', type: 'js', difficulty: 'beginner', cloud: true, description: 'Material Design ripple effect on button clicks.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><div style="background:#FD1875;border-radius:6px;padding:8px 16px;font-size:9px;color:#fff;font-family:sans-serif;font-weight:600;position:relative;overflow:hidden;cursor:pointer">Click Me<div style="position:absolute;width:20px;height:20px;background:rgba(255,255,255,0.4);border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);animation:sit-cat-ripple 1.5s ease-out infinite"></div></div></div>' },
            { name: 'scroll-reveal', label: 'Scroll Reveal', type: 'js', difficulty: 'beginner', cloud: true, description: 'Elements animate in as you scroll down the dashboard.', preview: 'opacity: 0.3; transform: translateY(10px);',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px;box-sizing:border-box"><div style="width:80%;height:14px;background:#222326;border-radius:3px;opacity:1"></div><div style="width:80%;height:14px;background:#222326;border-radius:3px;opacity:0.6"></div><div style="width:80%;height:14px;background:#222326;border-radius:3px;opacity:0.3"></div><div style="width:80%;height:14px;background:#222326;border-radius:3px;opacity:0.1"></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" style="margin-top:2px"><polyline points="6 9 12 15 18 9"></polyline></svg></div>' },
            { name: 'typewriter-text', label: 'Typewriter Text', type: 'js', difficulty: 'beginner', cloud: true, description: 'Dashboard and panel titles appear with typewriter effect.', preview: 'font-family: monospace; border-right: 2px solid #FD1875;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;font-family:monospace"><div style="font-size:12px;color:#fff;border-right:2px solid #FD1875;padding-right:2px;animation:sit-cat-blink 1s step-end infinite;overflow:hidden;white-space:nowrap;width:60px;animation:sit-cat-typewriter 3s steps(8) infinite,sit-cat-blink 0.7s step-end infinite">Security</div></div>' },
            { name: 'number-morph', label: 'Number Morph', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Single values morph/count up from 0 to their actual value.', preview: 'font-size: 32px; font-weight: bold;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;font-family:sans-serif"><div style="text-align:center"><div style="font-size:28px;font-weight:700;color:#FD1875;font-variant-numeric:tabular-nums;animation:sit-cat-count 2s ease-out infinite">47,832</div><div style="font-size:7px;color:#888;margin-top:2px">morphing from 0</div></div></div>' },
            { name: 'pulse-attention', label: 'Pulse Attention', type: 'css', difficulty: 'beginner', cloud: true, description: 'Gentle pulse animation on critical status values.', preview: 'animation: sit-cat-pulse 2s ease-in-out infinite;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:8px;font-family:sans-serif"><div style="width:10px;height:10px;border-radius:50%;background:#ff4444;animation:sit-cat-pulse-dot 1.5s ease-in-out infinite;box-shadow:0 0 8px rgba(255,68,68,0.5)"></div><span style="font-size:10px;color:#ff4444;font-weight:700">CRITICAL</span></div>' },
            { name: 'shimmer-loading', label: 'Shimmer Loading', type: 'css', difficulty: 'beginner', cloud: true, description: 'Shimmer gradient sweep while panels load data.', preview: 'background: linear-gradient(90deg, #1a1b1e 25%, #2a2b2e 50%, #1a1b1e 75%); background-size: 200% 100%;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:10px;box-sizing:border-box;display:flex;flex-direction:column;gap:6px"><div style="height:12px;border-radius:4px;background:linear-gradient(90deg,#222326 25%,#333 50%,#222326 75%);background-size:200% 100%;animation:sit-cat-shimmer 1.5s infinite;width:50%"></div><div style="flex:1;border-radius:6px;background:linear-gradient(90deg,#222326 25%,#333 50%,#222326 75%);background-size:200% 100%;animation:sit-cat-shimmer 1.5s infinite 0.2s"></div></div>' },
            { name: 'stagger-grid', label: 'Stagger Grid', type: 'css', difficulty: 'beginner', cloud: true, description: 'Panels appear in a staggered cascade waterfall pattern.', preview: 'opacity: 0.3; transform: scale(0.95);',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:8px;box-sizing:border-box"><div style="background:#222326;border-radius:4px;animation:sit-cat-stagger 2s ease-out infinite"></div><div style="background:#222326;border-radius:4px;animation:sit-cat-stagger 2s ease-out infinite 0.15s"></div><div style="background:#222326;border-radius:4px;animation:sit-cat-stagger 2s ease-out infinite 0.3s"></div><div style="background:#222326;border-radius:4px;animation:sit-cat-stagger 2s ease-out infinite 0.45s"></div></div>' }
        ],
        visualizations: [
            { name: 'animated-svg-network-map', label: 'SVG Network Map', type: 'js', difficulty: 'advanced', cloud: true, description: 'Interactive draggable network topology with animated data flow.', preview: 'background: #0a0e17;',
              previewHtml: '<div style="width:100%;height:100%;background:#0a0e17;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 100 70" style="width:90%;height:80%"><line x1="50" y1="15" x2="20" y2="45" stroke="rgba(253,24,117,0.3)" stroke-width="1"/><line x1="50" y1="15" x2="80" y2="45" stroke="rgba(253,24,117,0.3)" stroke-width="1"/><line x1="20" y1="45" x2="50" y2="60" stroke="rgba(49,130,206,0.3)" stroke-width="1"/><line x1="80" y1="45" x2="50" y2="60" stroke="rgba(49,130,206,0.3)" stroke-width="1"/><circle cx="50" cy="15" r="6" fill="#222" stroke="#FD1875" stroke-width="1.5"/><circle cx="20" cy="45" r="5" fill="#222" stroke="#3182ce" stroke-width="1.5"/><circle cx="80" cy="45" r="5" fill="#222" stroke="#3182ce" stroke-width="1.5"/><circle cx="50" cy="60" r="5" fill="#222" stroke="#5CC05C" stroke-width="1.5"/><circle cx="50" cy="15" r="2" fill="#FD1875"><animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/></circle></svg></div>' },
            { name: 'globe-3d-rotate', label: '3D Globe', type: 'js', difficulty: 'advanced', cloud: true, description: '3D rotating globe with data points using CSS 3D transforms.', preview: 'background: #0a0e17; border-radius: 50%;',
              previewHtml: '<div style="width:100%;height:100%;background:#0a0e17;display:flex;align-items:center;justify-content:center"><div style="width:60px;height:60px;border-radius:50%;border:1.5px solid rgba(100,180,255,0.3);position:relative;overflow:hidden;animation:sit-cat-spin 12s linear infinite"><div style="position:absolute;width:100%;height:100%;border-radius:50%;border-right:1px solid rgba(100,180,255,0.15)"></div><div style="position:absolute;top:25%;left:30%;width:4px;height:4px;background:#FD1875;border-radius:50%;box-shadow:0 0 4px #FD1875"></div><div style="position:absolute;top:50%;left:60%;width:3px;height:3px;background:#5CC05C;border-radius:50%;box-shadow:0 0 4px #5CC05C"></div><div style="position:absolute;top:65%;left:25%;width:3px;height:3px;background:#ffbb33;border-radius:50%;box-shadow:0 0 4px #ffbb33"></div><div style="position:absolute;inset:0;border-radius:50%;border:0.5px dashed rgba(100,180,255,0.1)"></div></div></div>' },
            { name: 'sankey-flow-styled', label: 'Sankey Flow', type: 'css', difficulty: 'intermediate', cloud: true, description: 'Enhanced Sankey diagram styling with gradient flows.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 100 60" style="width:90%;height:80%"><rect x="2" y="5" width="8" height="20" rx="2" fill="#FD1875"/><rect x="2" y="30" width="8" height="25" rx="2" fill="#3182ce"/><rect x="90" y="8" width="8" height="15" rx="2" fill="#5CC05C"/><rect x="90" y="28" width="8" height="12" rx="2" fill="#ffbb33"/><rect x="90" y="44" width="8" height="10" rx="2" fill="#7c3aed"/><path d="M10,15 C50,15 50,15 90,15" fill="none" stroke="rgba(253,24,117,0.2)" stroke-width="8"/><path d="M10,40 C50,40 50,34 90,34" fill="none" stroke="rgba(49,130,206,0.2)" stroke-width="10"/><path d="M10,20 C50,20 50,48 90,48" fill="none" stroke="rgba(124,58,237,0.2)" stroke-width="5"/></svg></div>' },
            { name: 'heatmap-calendar', label: 'Heatmap Calendar', type: 'js', difficulty: 'intermediate', cloud: true, description: 'GitHub-style contribution heatmap calendar visualization.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:2px;padding:10px;box-sizing:border-box;flex-wrap:wrap"><div style="width:8px;height:8px;background:#0e4429;border-radius:1px"></div><div style="width:8px;height:8px;background:#006d32;border-radius:1px"></div><div style="width:8px;height:8px;background:#222326;border-radius:1px"></div><div style="width:8px;height:8px;background:#26a641;border-radius:1px"></div><div style="width:8px;height:8px;background:#39d353;border-radius:1px"></div><div style="width:8px;height:8px;background:#006d32;border-radius:1px"></div><div style="width:8px;height:8px;background:#222326;border-radius:1px"></div><div style="width:8px;height:8px;background:#0e4429;border-radius:1px"></div><div style="width:8px;height:8px;background:#39d353;border-radius:1px"></div><div style="width:8px;height:8px;background:#26a641;border-radius:1px"></div><div style="width:8px;height:8px;background:#222326;border-radius:1px"></div><div style="width:8px;height:8px;background:#0e4429;border-radius:1px"></div><div style="width:8px;height:8px;background:#006d32;border-radius:1px"></div><div style="width:8px;height:8px;background:#222326;border-radius:1px"></div><div style="width:8px;height:8px;background:#39d353;border-radius:1px"></div><div style="width:8px;height:8px;background:#26a641;border-radius:1px"></div><div style="width:8px;height:8px;background:#0e4429;border-radius:1px"></div><div style="width:8px;height:8px;background:#222326;border-radius:1px"></div><div style="width:8px;height:8px;background:#006d32;border-radius:1px"></div><div style="width:8px;height:8px;background:#39d353;border-radius:1px"></div></div>' },
            { name: 'timeline-gantt', label: 'Timeline Gantt', type: 'js', difficulty: 'advanced', cloud: true, description: 'Horizontal timeline/Gantt chart for events and tasks.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:8px;box-sizing:border-box;display:flex;flex-direction:column;gap:4px;font-family:sans-serif"><div style="display:flex;align-items:center;gap:4px"><div style="font-size:6px;color:#888;width:24px">Task A</div><div style="flex:1;height:8px;background:#222326;border-radius:3px;position:relative"><div style="position:absolute;left:5%;width:60%;height:100%;background:#FD1875;border-radius:3px;opacity:0.8"></div></div></div><div style="display:flex;align-items:center;gap:4px"><div style="font-size:6px;color:#888;width:24px">Task B</div><div style="flex:1;height:8px;background:#222326;border-radius:3px;position:relative"><div style="position:absolute;left:20%;width:45%;height:100%;background:#3182ce;border-radius:3px;opacity:0.8"></div></div></div><div style="display:flex;align-items:center;gap:4px"><div style="font-size:6px;color:#888;width:24px">Task C</div><div style="flex:1;height:8px;background:#222326;border-radius:3px;position:relative"><div style="position:absolute;left:40%;width:55%;height:100%;background:#5CC05C;border-radius:3px;opacity:0.8"></div></div></div><div style="display:flex;align-items:center;gap:4px"><div style="font-size:6px;color:#888;width:24px">Task D</div><div style="flex:1;height:8px;background:#222326;border-radius:3px;position:relative"><div style="position:absolute;left:55%;width:35%;height:100%;background:#ffbb33;border-radius:3px;opacity:0.8"></div></div></div></div>' },
            { name: 'kanban-board', label: 'Kanban Board', type: 'js', difficulty: 'advanced', cloud: true, description: 'Drag-and-drop Kanban board for incident tracking.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;gap:3px;padding:6px;box-sizing:border-box;font-family:sans-serif"><div style="flex:1;display:flex;flex-direction:column"><div style="font-size:7px;color:#ffbb33;font-weight:700;margin-bottom:3px;text-align:center">To Do</div><div style="flex:1;background:#222326;border-radius:4px;padding:3px;display:flex;flex-direction:column;gap:2px"><div style="background:#2a2b2e;border-radius:2px;padding:3px;font-size:6px;color:#ccc;border-left:2px solid #ffbb33">Fix bug</div><div style="background:#2a2b2e;border-radius:2px;padding:3px;font-size:6px;color:#ccc;border-left:2px solid #ffbb33">Update</div></div></div><div style="flex:1;display:flex;flex-direction:column"><div style="font-size:7px;color:#3182ce;font-weight:700;margin-bottom:3px;text-align:center">In Progress</div><div style="flex:1;background:#222326;border-radius:4px;padding:3px;display:flex;flex-direction:column;gap:2px"><div style="background:#2a2b2e;border-radius:2px;padding:3px;font-size:6px;color:#ccc;border-left:2px solid #3182ce">Deploy</div></div></div><div style="flex:1;display:flex;flex-direction:column"><div style="font-size:7px;color:#5CC05C;font-weight:700;margin-bottom:3px;text-align:center">Done</div><div style="flex:1;background:#222326;border-radius:4px;padding:3px;display:flex;flex-direction:column;gap:2px"><div style="background:#2a2b2e;border-radius:2px;padding:3px;font-size:6px;color:#ccc;border-left:2px solid #5CC05C">Review</div><div style="background:#2a2b2e;border-radius:2px;padding:3px;font-size:6px;color:#ccc;border-left:2px solid #5CC05C">Test</div></div></div></div>' },
            { name: 'org-chart-interactive', label: 'Org Chart', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Interactive clickable organization/hierarchy chart.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 100 65" style="width:90%;height:85%"><line x1="50" y1="18" x2="25" y2="35" stroke="#3a3b3e" stroke-width="1"/><line x1="50" y1="18" x2="75" y2="35" stroke="#3a3b3e" stroke-width="1"/><line x1="25" y1="45" x2="15" y2="55" stroke="#3a3b3e" stroke-width="1"/><line x1="25" y1="45" x2="35" y2="55" stroke="#3a3b3e" stroke-width="1"/><rect x="40" y="5" width="20" height="13" rx="3" fill="#222" stroke="#FD1875" stroke-width="1"/><text x="50" y="14" text-anchor="middle" fill="#fff" font-size="5" font-family="sans-serif">CEO</text><rect x="15" y="35" width="20" height="12" rx="3" fill="#222" stroke="#3182ce" stroke-width="1"/><text x="25" y="43" text-anchor="middle" fill="#fff" font-size="5" font-family="sans-serif">VP</text><rect x="65" y="35" width="20" height="12" rx="3" fill="#222" stroke="#3182ce" stroke-width="1"/><text x="75" y="43" text-anchor="middle" fill="#fff" font-size="5" font-family="sans-serif">VP</text><rect x="5" y="53" width="18" height="10" rx="2" fill="#222" stroke="#5CC05C" stroke-width="1"/><text x="14" y="60" text-anchor="middle" fill="#aaa" font-size="4" font-family="sans-serif">Eng</text><rect x="27" y="53" width="18" height="10" rx="2" fill="#222" stroke="#5CC05C" stroke-width="1"/><text x="36" y="60" text-anchor="middle" fill="#aaa" font-size="4" font-family="sans-serif">Ops</text></svg></div>' },
            { name: 'terminal-log-viewer', label: 'Terminal Log Viewer', type: 'js', difficulty: 'intermediate', cloud: true, description: 'Retro terminal-style log display with green-on-black.', preview: 'background: #0a0a0a; color: #00ff00; font-family: monospace;',
              previewHtml: '<div style="width:100%;height:100%;background:#0a0a0a;padding:6px;box-sizing:border-box;font-family:monospace;font-size:7px;overflow:hidden;display:flex;flex-direction:column;gap:2px"><div style="color:#00ff00;opacity:0.5">[14:32:01] INFO Starting service...</div><div style="color:#00ff00;opacity:0.6">[14:32:02] INFO Connected to DB</div><div style="color:#ffbb33;opacity:0.8">[14:32:03] WARN High latency: 450ms</div><div style="color:#00ff00;opacity:0.7">[14:32:04] INFO Request processed</div><div style="color:#ff4444;opacity:0.9">[14:32:05] ERROR Timeout on host-3</div><div style="color:#00ff00;animation:sit-cat-blink 1s step-end infinite">&#9608;</div></div>' },
            { name: 'table-enhanced', label: 'Table Enhanced', type: 'css', difficulty: 'beginner', cloud: true, description: 'Major table upgrade: sticky headers, better hover, zebra stripes.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:6px;box-sizing:border-box;font-family:sans-serif;font-size:7px;overflow:hidden"><div style="display:flex;background:#222326;padding:3px 4px;border-radius:3px 3px 0 0;font-weight:700;color:#FD1875;gap:4px"><span style="flex:1">Host</span><span style="flex:1">Status</span><span style="flex:1">CPU</span></div><div style="display:flex;padding:3px 4px;color:#ccc;gap:4px;background:#1a1b1e"><span style="flex:1">srv-01</span><span style="flex:1;color:#5CC05C">UP</span><span style="flex:1">23%</span></div><div style="display:flex;padding:3px 4px;color:#ccc;gap:4px;background:#1e1f22"><span style="flex:1">srv-02</span><span style="flex:1;color:#5CC05C">UP</span><span style="flex:1">67%</span></div><div style="display:flex;padding:3px 4px;color:#ccc;gap:4px;background:#1a1b1e"><span style="flex:1">srv-03</span><span style="flex:1;color:#ff4444">DOWN</span><span style="flex:1">0%</span></div><div style="display:flex;padding:3px 4px;color:#ccc;gap:4px;background:#1e1f22"><span style="flex:1">srv-04</span><span style="flex:1;color:#ffbb33">WARN</span><span style="flex:1">89%</span></div></div>' },
            { name: 'chart-annotations', label: 'Chart Annotations', type: 'js', difficulty: 'advanced', cloud: true, description: 'Add vertical markers and labels to time-series charts.', preview: 'background: #1a1b1e;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;padding:8px;box-sizing:border-box"><svg viewBox="0 0 100 50" style="width:100%;height:100%"><polyline fill="none" stroke="#3182ce" stroke-width="1.5" points="0,40 12,35 25,38 38,20 50,25 62,15 75,18 88,10 100,12"/><line x1="38" y1="5" x2="38" y2="45" stroke="#FD1875" stroke-width="0.8" stroke-dasharray="2,2"/><rect x="30" y="2" width="16" height="7" rx="2" fill="#FD1875"/><text x="38" y="7.5" text-anchor="middle" fill="#fff" font-size="4" font-family="sans-serif">Deploy</text><line x1="75" y1="5" x2="75" y2="45" stroke="#ffbb33" stroke-width="0.8" stroke-dasharray="2,2"/><rect x="67" y="2" width="16" height="7" rx="2" fill="#ffbb33"/><text x="75" y="7.5" text-anchor="middle" fill="#000" font-size="4" font-family="sans-serif">Incident</text></svg></div>' },
            { name: 'print-optimized', label: 'Print Optimized', type: 'css', difficulty: 'beginner', cloud: true, description: 'Print-ready layout that removes chrome and adjusts for paper.', preview: 'background: #ffffff; color: #000000;',
              previewHtml: '<div style="width:100%;height:100%;background:#ffffff;padding:8px;box-sizing:border-box;font-family:Georgia,serif;position:relative"><div style="font-size:10px;font-weight:700;color:#000;margin-bottom:4px;border-bottom:1px solid #000;padding-bottom:2px">Report Title</div><div style="display:flex;gap:4px;margin-bottom:4px"><div style="flex:1;border:1px solid #ddd;border-radius:2px;padding:3px;text-align:center"><div style="font-size:12px;font-weight:700;color:#000">1,247</div><div style="font-size:6px;color:#666">Events</div></div><div style="flex:1;border:1px solid #ddd;border-radius:2px;padding:3px;text-align:center"><div style="font-size:12px;font-weight:700;color:#000">0.42%</div><div style="font-size:6px;color:#666">Errors</div></div></div><div style="position:absolute;bottom:4px;right:6px;font-size:5px;color:#999">&#128424; Print-Ready</div></div>' }
        ],
        ui: [
            // === CSS Framework ===
            { name: 'sit-core', label: 'Core CSS Framework', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-core.css', description: '230+ CSS variables, design tokens, typography, spacing, animations. The foundation — include this with any component.', preview: 'background: linear-gradient(135deg, #111215, #1a1b1e); border-left: 4px solid #FD1875;',
              previewHtml: '<div style="width:100%;height:100%;background:#111215;padding:8px;box-sizing:border-box;display:flex;flex-wrap:wrap;gap:3px;align-content:center;justify-content:center"><div style="width:14px;height:14px;border-radius:3px;background:#FD1875"></div><div style="width:14px;height:14px;border-radius:3px;background:#FB4E4D"></div><div style="width:14px;height:14px;border-radius:3px;background:#FD7A2B"></div><div style="width:14px;height:14px;border-radius:3px;background:#5CC05C"></div><div style="width:14px;height:14px;border-radius:3px;background:#3182ce"></div><div style="width:14px;height:14px;border-radius:3px;background:#7c3aed"></div><div style="width:14px;height:14px;border-radius:3px;background:#00ffff"></div><div style="width:14px;height:14px;border-radius:3px;background:#d4af37"></div><div style="width:14px;height:14px;border-radius:3px;background:#818cf8"></div><div style="font-size:7px;color:#888;width:100%;text-align:center;margin-top:4px;font-family:sans-serif">230+ Design Tokens</div></div>' },
            { name: 'sit-components', label: 'Full Component Stylesheet', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'Complete CSS for ALL UI components: buttons, modals, toasts, cards, tables, badges, tabs, accordions, alerts, tooltips, dropdowns, forms, progress bars, spinners.', preview: 'background: #1f2527; border: 1px solid #3c444d; border-radius: 12px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1f2527;display:flex;flex-wrap:wrap;gap:3px;padding:6px;box-sizing:border-box;align-items:center;justify-content:center"><div style="background:#FD1875;border-radius:4px;padding:2px 6px;font-size:6px;color:#fff;font-family:sans-serif">Btn</div><div style="background:rgba(92,192,92,0.15);color:#5CC05C;border-radius:999px;padding:1px 5px;font-size:6px;font-family:sans-serif">Badge</div><div style="width:20px;height:3px;background:#3182ce;border-radius:2px"></div><div style="width:6px;height:6px;border:1.5px solid #FD1875;border-top-color:transparent;border-radius:50%;animation:sit-cat-spin 1s linear infinite"></div><div style="background:#2a2f32;border:1px solid #3c444d;border-radius:3px;padding:2px 4px;font-size:5px;color:#888;font-family:sans-serif">Input</div><div style="background:#222;border-radius:2px;padding:1px 4px;font-size:5px;color:#888;font-family:sans-serif;border-left:2px solid #ffbb33">Alert</div></div>' },

            // === Interactive Components (JS) ===
            { name: 'sit-modal', label: 'Modal Dialogs', type: 'js', difficulty: 'beginner', cloud: true, ref: 'components/sit-modal.js', description: 'Modal dialogs in 4 sizes (sm/md/lg/xl). Includes alert(), confirm() helpers. Backdrop blur, focus management, ESC to close.', preview: 'background: #171b1e; border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12);',
              previewHtml: '<div style="width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center"><div style="background:#1f2527;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);width:75%;padding:6px;font-family:sans-serif"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:8px;color:#fff;font-weight:700">Modal Title</span><span style="font-size:10px;color:#888;cursor:pointer">&times;</span></div><div style="font-size:6px;color:#aaa;margin-bottom:6px">Content goes here...</div><div style="display:flex;gap:3px;justify-content:flex-end"><div style="background:#2a2f32;border-radius:3px;padding:2px 6px;font-size:6px;color:#888">Cancel</div><div style="background:#FD1875;border-radius:3px;padding:2px 6px;font-size:6px;color:#fff">Confirm</div></div></div></div>' },
            { name: 'sit-toast', label: 'Toast Notifications', type: 'js', difficulty: 'beginner', cloud: true, ref: 'components/sit-toast.js', description: 'Slide-in toast notifications: success, error, warning, info. Auto-dismiss, closable, configurable position (4 corners).', preview: 'background: linear-gradient(135deg, #1a2f1a 0%, #1a1e21 100%); border-left: 4px solid #5CC05C; border-radius: 8px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:6px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:flex-end;gap:3px;font-family:sans-serif"><div style="background:#1a2f1a;border-left:3px solid #5CC05C;border-radius:4px;padding:4px 6px;font-size:7px;color:#5CC05C;display:flex;align-items:center;gap:3px">&#10003; Success</div><div style="background:#2f1a1a;border-left:3px solid #ff4444;border-radius:4px;padding:4px 6px;font-size:7px;color:#ff4444;display:flex;align-items:center;gap:3px">&#10007; Error</div><div style="background:#2f2a1a;border-left:3px solid #ffbb33;border-radius:4px;padding:4px 6px;font-size:7px;color:#ffbb33;display:flex;align-items:center;gap:3px">&#9888; Warning</div></div>' },
            { name: 'sit-button', label: 'Buttons', type: 'js', difficulty: 'beginner', cloud: true, ref: 'components/sit-button.js', description: '6 button types (primary, secondary, outline, ghost, danger, success), 3 sizes, icon support, loading states, built-in icon set.', preview: 'background: #FD1875; color: white; border-radius: 8px; padding: 8px 16px; font-weight: 600;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;padding:8px;box-sizing:border-box"><div style="background:#FD1875;border-radius:4px;padding:4px 8px;font-size:7px;color:#fff;font-family:sans-serif;font-weight:600">Primary</div><div style="background:#2a2f32;border-radius:4px;padding:4px 8px;font-size:7px;color:#ccc;font-family:sans-serif">Secondary</div><div style="background:#e53e3e;border-radius:4px;padding:4px 8px;font-size:7px;color:#fff;font-family:sans-serif;font-weight:600">Danger</div></div>' },
            { name: 'sit-checkbox', label: 'Checkboxes', type: 'js', difficulty: 'beginner', cloud: true, ref: 'components/sit-checkbox.js', description: 'Custom styled checkboxes with group support. Vertical/horizontal layouts, select all/deselect all, onChange callbacks.', preview: 'background: #1f2527; border: 2px solid #5a6577; border-radius: 4px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1f2527;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:10px 14px;box-sizing:border-box;gap:5px;font-family:sans-serif"><div style="display:flex;align-items:center;gap:5px"><div style="width:12px;height:12px;border-radius:2px;background:#FD1875;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff">&#10003;</div><span style="font-size:8px;color:#ccc">Alerts enabled</span></div><div style="display:flex;align-items:center;gap:5px"><div style="width:12px;height:12px;border-radius:2px;background:#FD1875;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff">&#10003;</div><span style="font-size:8px;color:#ccc">Auto-refresh</span></div><div style="display:flex;align-items:center;gap:5px"><div style="width:12px;height:12px;border-radius:2px;border:1.5px solid #5a6577"></div><span style="font-size:8px;color:#888">Verbose logs</span></div></div>' },
            { name: 'sit-toggle', label: 'Toggle Switches', type: 'js', difficulty: 'beginner', cloud: true, ref: 'components/sit-toggle.js', description: 'iOS-style toggle switches in 3 sizes. Smooth animated transitions, label positioning, disabled states.', preview: 'background: #FD1875; border-radius: 999px; width: 44px; height: 24px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1f2527;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px"><div style="display:flex;align-items:center;gap:6px"><div style="width:30px;height:16px;background:#FD1875;border-radius:999px;position:relative"><div style="width:12px;height:12px;background:#fff;border-radius:50%;position:absolute;top:2px;right:2px"></div></div><span style="font-size:7px;color:#ccc;font-family:sans-serif">ON</span></div><div style="display:flex;align-items:center;gap:6px"><div style="width:30px;height:16px;background:#3a3b3e;border-radius:999px;position:relative"><div style="width:12px;height:12px;background:#888;border-radius:50%;position:absolute;top:2px;left:2px"></div></div><span style="font-size:7px;color:#888;font-family:sans-serif">OFF</span></div></div>' },
            { name: 'sit-table', label: 'Data Tables', type: 'js', difficulty: 'intermediate', cloud: true, ref: 'components/sit-table.js', description: 'Feature-rich data tables: sortable columns, pagination, search/filter, custom cell rendering, clickable rows, striped styling.', preview: 'background: #1f2527; border: 1px solid #3c444d;',
              previewHtml: '<div style="width:100%;height:100%;background:#1f2527;padding:6px;box-sizing:border-box;font-family:sans-serif;font-size:7px;overflow:hidden"><div style="display:flex;background:#171b1e;padding:3px 4px;border-radius:3px 3px 0 0;font-weight:700;color:#FD1875;gap:4px;border-bottom:1px solid #3c444d"><span style="flex:2">Name</span><span style="flex:1">Value &#9660;</span><span style="flex:1">Status</span></div><div style="display:flex;padding:3px 4px;color:#ccc;gap:4px"><span style="flex:2">Alpha</span><span style="flex:1">1,234</span><span style="flex:1;color:#5CC05C">OK</span></div><div style="display:flex;padding:3px 4px;color:#ccc;gap:4px;background:rgba(255,255,255,0.02)"><span style="flex:2">Beta</span><span style="flex:1">567</span><span style="flex:1;color:#ffbb33">Warn</span></div><div style="display:flex;padding:3px 4px;color:#ccc;gap:4px"><span style="flex:2">Gamma</span><span style="flex:1">89</span><span style="flex:1;color:#ff4444">Err</span></div></div>' },

            // === CSS-Only Components (from sit-components.css) ===
            { name: 'cards', label: 'Cards', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'Card containers with header, body, footer sections. Clean borders, subtle backgrounds, perfect for grouping content.', preview: 'background: #1f2527; border: 1px solid #3c444d; border-radius: 12px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;padding:8px;box-sizing:border-box"><div style="width:85%;background:#1f2527;border:1px solid #3c444d;border-radius:8px;overflow:hidden"><div style="padding:5px 8px;border-bottom:1px solid #3c444d;font-size:8px;color:#fff;font-weight:700;font-family:sans-serif">Card Header</div><div style="padding:6px 8px;font-size:7px;color:#aaa;font-family:sans-serif">Card body content goes here with supporting text.</div></div></div>' },
            { name: 'badges', label: 'Badges & Pills', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'Status badges in 5 colors: primary, success, warning, error, info. Pill-shaped with uppercase text. Great for status indicators.', preview: 'background: rgba(253,24,117,0.1); color: #FD1875; border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: 600;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;padding:8px;box-sizing:border-box"><span style="background:rgba(92,192,92,0.15);color:#5CC05C;border-radius:999px;padding:2px 7px;font-size:7px;font-family:sans-serif;font-weight:600">Success</span><span style="background:rgba(255,187,51,0.15);color:#ffbb33;border-radius:999px;padding:2px 7px;font-size:7px;font-family:sans-serif;font-weight:600">Warning</span><span style="background:rgba(255,68,68,0.15);color:#ff4444;border-radius:999px;padding:2px 7px;font-size:7px;font-family:sans-serif;font-weight:600">Error</span><span style="background:rgba(49,130,206,0.15);color:#3182ce;border-radius:999px;padding:2px 7px;font-size:7px;font-family:sans-serif;font-weight:600">Info</span></div>' },
            { name: 'progress-bars', label: 'Progress Bars', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'Animated progress bars with color variants (success/warning/error), striped pattern, and animated stripes options.', preview: 'background: #2b3033; border-radius: 999px; height: 8px; overflow: hidden;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:10px 12px;box-sizing:border-box"><div style="height:6px;background:#2b3033;border-radius:999px;overflow:hidden"><div style="width:80%;height:100%;background:#5CC05C;border-radius:999px"></div></div><div style="height:6px;background:#2b3033;border-radius:999px;overflow:hidden"><div style="width:55%;height:100%;background:#ffbb33;border-radius:999px"></div></div><div style="height:6px;background:#2b3033;border-radius:999px;overflow:hidden"><div style="width:30%;height:100%;background:#ff4444;border-radius:999px"></div></div></div>' },
            { name: 'tabs', label: 'Tabs', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'Tab navigation with underline active indicator. Animated panel transitions, clean hover states.', preview: 'border-bottom: 2px solid #FD1875; padding: 8px 16px; color: #FD1875; font-weight: 500;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:10px 8px 0;box-sizing:border-box;font-family:sans-serif"><div style="display:flex;border-bottom:1px solid #2a2b2e"><div style="padding:4px 10px;font-size:8px;color:#FD1875;border-bottom:2px solid #FD1875;font-weight:600">Active</div><div style="padding:4px 10px;font-size:8px;color:#888">Tab 2</div><div style="padding:4px 10px;font-size:8px;color:#888">Tab 3</div></div><div style="padding:8px;font-size:7px;color:#aaa">Tab panel content</div></div>' },
            { name: 'accordions', label: 'Accordions', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'Expandable/collapsible accordion sections with smooth height transitions and rotating chevron icons.', preview: 'background: #171d21; border: 1px solid #3c444d; border-radius: 8px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:6px;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;font-family:sans-serif"><div style="background:#171d21;border:1px solid #3c444d;border-radius:4px"><div style="padding:4px 6px;display:flex;justify-content:space-between;font-size:8px;color:#fff"><span>Section 1</span><span style="transform:rotate(180deg);display:inline-block;color:#FD1875">&#9660;</span></div><div style="padding:3px 6px;font-size:7px;color:#aaa;border-top:1px solid #3c444d">Expanded content here</div></div><div style="background:#171d21;border:1px solid #3c444d;border-radius:4px;padding:4px 6px;display:flex;justify-content:space-between;font-size:8px;color:#fff"><span>Section 2</span><span style="color:#888">&#9660;</span></div><div style="background:#171d21;border:1px solid #3c444d;border-radius:4px;padding:4px 6px;display:flex;justify-content:space-between;font-size:8px;color:#fff"><span>Section 3</span><span style="color:#888">&#9660;</span></div></div>' },
            { name: 'alerts', label: 'Alert Boxes', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'Alert boxes in 4 styles: success, error, warning, info. Left border accent, icon support, title + message layout.', preview: 'background: rgba(253,24,117,0.1); border-left: 4px solid #FD1875; border-radius: 8px; padding: 12px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:6px;box-sizing:border-box;display:flex;flex-direction:column;gap:4px;font-family:sans-serif"><div style="background:rgba(92,192,92,0.08);border-left:3px solid #5CC05C;border-radius:4px;padding:4px 6px;font-size:7px;color:#5CC05C">&#10003; Operation successful</div><div style="background:rgba(255,68,68,0.08);border-left:3px solid #ff4444;border-radius:4px;padding:4px 6px;font-size:7px;color:#ff4444">&#10007; Connection failed</div></div>' },
            { name: 'tooltips', label: 'Tooltips', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'Hover-triggered tooltip popups with smooth fade animation. Auto-positioned above the element.', preview: 'background: #333a3f; border-radius: 4px; padding: 4px 8px; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;font-family:sans-serif"><div style="position:relative"><div style="background:#333a3f;border-radius:4px;padding:3px 8px;font-size:7px;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.4);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:6px;white-space:nowrap">Helpful tooltip text<div style="position:absolute;top:100%;left:50%;transform:translateX(-50%);border:4px solid transparent;border-top-color:#333a3f"></div></div><div style="background:#222326;border-radius:4px;padding:4px 10px;font-size:8px;color:#aaa">Hover me</div></div></div>' },
            { name: 'dropdowns', label: 'Dropdown Menus', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'Dropdown menus with dividers, hover highlighting, and danger item styling. Smooth appear/disappear animation.', preview: 'background: #333a3f; border: 1px solid #3c444d; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:flex-start;justify-content:center;padding-top:10px;box-sizing:border-box"><div style="background:#333a3f;border:1px solid #3c444d;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,0.5);min-width:70px;font-family:sans-serif;overflow:hidden"><div style="padding:3px 8px;font-size:7px;color:#fff;background:rgba(253,24,117,0.1)">Edit</div><div style="padding:3px 8px;font-size:7px;color:#fff">Duplicate</div><div style="height:1px;background:#3c444d"></div><div style="padding:3px 8px;font-size:7px;color:#ff4444">Delete</div></div></div>' },
            { name: 'form-inputs', label: 'Form Inputs & Selects', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'Styled text inputs and select dropdowns with focus rings, error states, labels, help text. Custom select arrow.', preview: 'background: #1f2527; border: 1px solid #3c444d; border-radius: 8px; padding: 8px 16px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;padding:8px;box-sizing:border-box;display:flex;flex-direction:column;gap:5px;justify-content:center;font-family:sans-serif"><div style="font-size:7px;color:#aaa">Search hosts</div><div style="background:#1f2527;border:1px solid #3c444d;border-radius:4px;padding:4px 6px;font-size:8px;color:#666">Type here...</div><div style="font-size:7px;color:#aaa;margin-top:2px">Environment</div><div style="background:#1f2527;border:1px solid #3c444d;border-radius:4px;padding:4px 6px;font-size:8px;color:#ccc;display:flex;justify-content:space-between"><span>Production</span><span style="color:#888">&#9660;</span></div></div>' },
            { name: 'spinners', label: 'Loading Spinners', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'CSS-only loading spinners in 3 sizes (sm/md/lg). Smooth rotation animation with brand color accent.', preview: 'border: 3px solid #2b3033; border-top-color: #FD1875; border-radius: 50%; width: 24px; height: 24px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;gap:12px"><div style="width:16px;height:16px;border:2px solid #2b3033;border-top-color:#FD1875;border-radius:50%;animation:sit-cat-spin 0.8s linear infinite"></div><div style="width:24px;height:24px;border:3px solid #2b3033;border-top-color:#FD1875;border-radius:50%;animation:sit-cat-spin 0.8s linear infinite"></div><div style="width:32px;height:32px;border:3px solid #2b3033;border-top-color:#FD1875;border-radius:50%;animation:sit-cat-spin 0.8s linear infinite"></div></div>' },
            { name: 'empty-states', label: 'Empty States', type: 'css', difficulty: 'beginner', cloud: true, ref: 'css/sit-components.css', description: 'Centered empty state layout with icon, title, message, and optional action button. For when there is no data to show.', preview: 'text-align: center; color: #6c757d; padding: 48px;',
              previewHtml: '<div style="width:100%;height:100%;background:#1a1b1e;display:flex;align-items:center;justify-content:center;font-family:sans-serif"><div style="text-align:center"><div style="font-size:24px;opacity:0.3;margin-bottom:4px">&#128202;</div><div style="font-size:9px;color:#888;font-weight:600">No Data Found</div><div style="font-size:7px;color:#666;margin-top:2px">Try adjusting your filters</div></div></div>' },

            // === Bundled Toolkit Script ===
            { name: 'sit-toolkit', label: 'Full Toolkit Bundle', type: 'js', difficulty: 'beginner', cloud: true, ref: 'js/sit-toolkit.js', description: 'Loads ALL interactive components (modals, toasts, buttons, checkboxes, toggles, tables) at once. Sets up the global SIT namespace.', preview: 'background: linear-gradient(135deg, #FD1875, #FB4E4D, #FD7A2B); border-radius: 12px;',
              previewHtml: '<div style="width:100%;height:100%;background:linear-gradient(135deg,#FD1875,#FB4E4D,#FD7A2B);display:flex;align-items:center;justify-content:center;font-family:sans-serif"><div style="text-align:center"><div style="font-size:11px;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.3)">Full Bundle</div><div style="font-size:7px;color:rgba(255,255,255,0.8);margin-top:2px">All Components Included</div></div></div>' }
        ]
    };

    // ========================================
    // Card Rendering
    // ========================================

    var difficultyBadges = {
        beginner: '<span class="sit-cat-badge sit-cat-badge-beginner">Beginner</span>',
        intermediate: '<span class="sit-cat-badge sit-cat-badge-intermediate">Intermediate</span>',
        advanced: '<span class="sit-cat-badge sit-cat-badge-advanced">Advanced</span>'
    };

    /**
     * Get the raw file path for a component
     */
    function getFilePath(category, comp) {
        if (comp.ref) {
            return TOOLKIT_APP + ':' + comp.ref;
        }
        var ext = comp.type === 'js' ? '.js' : '.css';
        return TOOLKIT_APP + ':' + category + '/' + comp.name + ext;
    }

    /**
     * Get the URL path for Dashboard Studio @import
     */
    function getStudioImportPath(category, comp) {
        if (comp.ref) {
            return '/static/app/' + TOOLKIT_APP + '/' + comp.ref;
        }
        var ext = comp.type === 'js' ? '.js' : '.css';
        return '/static/app/' + TOOLKIT_APP + '/' + category + '/' + comp.name + ext;
    }

    /**
     * Check if component works in Dashboard Studio (CSS = yes, JS = no)
     */
    function isStudioCompatible(comp) {
        return comp.type === 'css';
    }

    /**
     * Get the attribute name for a component (stylesheet or script)
     */
    function getAttrName(comp) {
        return comp.type === 'js' ? 'script' : 'stylesheet';
    }

    function renderCard(category, comp) {
        var filePath = getFilePath(category, comp);
        var attrName = getAttrName(comp);
        var studioOk = isStudioCompatible(comp);

        // Use previewHtml for live interactive previews, fall back to old preview style
        var previewContent = comp.previewHtml
            ? comp.previewHtml
            : '<div style="width:100%;height:100%;' + (comp.preview || '') + '"></div>';

        // Compatibility badges
        var compatBadges = '<span class="sit-cat-badge sit-cat-badge-classic" title="Works in Simple XML Classic dashboards">Classic</span>';
        if (studioOk) {
            compatBadges += '<span class="sit-cat-badge sit-cat-badge-studio" title="Works in Dashboard Studio">Studio</span>';
        }

        return '<div class="sit-cat-card" data-category="' + category + '" data-name="' + comp.name + '" data-studio="' + (studioOk ? 'yes' : 'no') + '">' +
            '<div class="sit-cat-card-preview">' +
                previewContent +
                '<div class="sit-cat-card-preview-label">' + comp.label + '</div>' +
            '</div>' +
            '<div class="sit-cat-card-body">' +
                '<div class="sit-cat-card-title">' + comp.label + '</div>' +
                '<div class="sit-cat-card-desc">' + comp.description + '</div>' +
                '<div class="sit-cat-card-meta">' +
                    compatBadges +
                    difficultyBadges[comp.difficulty] +
                    (comp.cloud ? '<span class="sit-cat-badge sit-cat-badge-cloud">Cloud OK</span>' : '') +
                '</div>' +
                '<div class="sit-cat-card-actions">' +
                    '<button class="sit-cat-btn sit-cat-btn-copy" data-ref="' + _.escape(filePath) + '" title="Copy for Classic Simple XML">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
                        ' Classic' +
                    '</button>' +
                    (studioOk ? '<button class="sit-cat-btn sit-cat-btn-copy sit-cat-btn-studio-copy" data-ref="@import url(\'' + getStudioImportPath(category, comp) + '\');" title="Copy for Dashboard Studio">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
                        ' Studio' +
                    '</button>' : '') +
                    '<button class="sit-cat-btn sit-cat-btn-info" data-category="' + category + '" data-name="' + comp.name + '" title="View full instructions">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>' +
                        ' Guide' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function renderCategory(category, comps) {
        var html = '';
        comps.forEach(function(comp) {
            html += renderCard(category, comp);
        });
        return html;
    }

    // ========================================
    // Category Tabs
    // ========================================

    function renderTabs() {
        var categories = [
            { key: 'all', label: 'All Components', icon: '&#9733;' },
            { key: 'ui', label: 'UI Components', icon: '&#9776;' },
            { key: 'backgrounds', label: 'Backgrounds', icon: '&#9635;' },
            { key: 'themes', label: 'Themes', icon: '&#9672;' },
            { key: 'widgets', label: 'Widgets', icon: '&#9638;' },
            { key: 'toggles', label: 'Controls', icon: '&#9881;' },
            { key: 'animations', label: 'Animations', icon: '&#10024;' },
            { key: 'visualizations', label: 'Visualizations', icon: '&#9681;' }
        ];

        var html = '<div class="sit-cat-tabs">';
        categories.forEach(function(cat, i) {
            html += '<button class="sit-cat-tab' + (i === 0 ? ' sit-cat-tab-active' : '') + '" data-category="' + cat.key + '">' +
                '<span class="sit-cat-tab-icon">' + cat.icon + '</span> ' + cat.label +
                '<span class="sit-cat-tab-count">' + (cat.key === 'all' ? getTotalCount() : (components[cat.key] || []).length) + '</span>' +
            '</button>';
        });
        html += '</div>';
        return html;
    }

    function getTotalCount() {
        var total = 0;
        Object.keys(components).forEach(function(key) {
            total += components[key].length;
        });
        return total;
    }

    // ========================================
    // Search
    // ========================================

    function renderSearch() {
        return '<div class="sit-cat-search-wrapper">' +
            '<svg class="sit-cat-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>' +
            '<input type="text" class="sit-cat-search" placeholder="Search components..." />' +
            '<span class="sit-cat-search-count"></span>' +
        '</div>';
    }

    // ========================================
    // Instructions Modal
    // ========================================

    function showInstructionsModal(category, name) {
        var comp = null;
        (components[category] || []).forEach(function(c) {
            if (c.name === name) comp = c;
        });
        if (!comp) return;

        var filePath = getFilePath(category, comp);
        var studioPath = getStudioImportPath(category, comp);
        var attrName = getAttrName(comp);
        var studioOk = isStudioCompatible(comp);

        // Classic Simple XML tag
        var dashTag = '<dashboard version="1.1" ' + attrName + '="' + filePath + '">';
        if (category === 'ui' && comp.type === 'js') {
            dashTag = '<dashboard version="1.1"\n  stylesheet="' + TOOLKIT_APP + ':css/sit-core.css,' + TOOLKIT_APP + ':css/sit-components.css"\n  script="' + filePath + '">';
        }

        // Studio @import line
        var studioImport = "@import url('" + studioPath + "');";

        var $backdrop = $('<div class="sit-cat-modal-backdrop">');
        var $modal = $(
            '<div class="sit-cat-modal">' +
                '<div class="sit-cat-modal-header">' +
                    '<h3>How to Use: ' + comp.label + '</h3>' +
                    '<button class="sit-cat-modal-close">&times;</button>' +
                '</div>' +
                '<div class="sit-cat-modal-body">' +

                    // === Format Tabs ===
                    '<div class="sit-cat-format-tabs" style="display:flex;gap:0;margin-bottom:20px;border-radius:8px;overflow:hidden;border:1px solid #3c444d;">' +
                        '<button class="sit-cat-format-tab sit-cat-format-tab-active" data-format="classic" style="flex:1;padding:10px;background:#FD1875;color:#fff;border:none;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;">Simple XML (Classic)</button>' +
                        (studioOk ?
                            '<button class="sit-cat-format-tab" data-format="studio" style="flex:1;padding:10px;background:#2b3033;color:#a0a0a0;border:none;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;">Dashboard Studio</button>'
                        :
                            '<button class="sit-cat-format-tab" data-format="studio" style="flex:1;padding:10px;background:#2b3033;color:#4a4a4a;border:none;font-size:13px;cursor:not-allowed;font-family:inherit;" disabled>Studio (JS not supported)</button>'
                        ) +
                    '</div>' +

                    // === CLASSIC Panel ===
                    '<div class="sit-cat-format-panel" data-format="classic">' +
                        '<div style="margin-bottom:16px">' +
                            '<h4 style="color:#FD1875;margin:0 0 10px;font-size:13px;">Copy &amp; paste this tag</h4>' +
                            '<div class="sit-cat-code-block">' +
                                '<code>' + _.escape(dashTag) + '</code>' +
                                '<button class="sit-cat-btn sit-cat-btn-copy-sm" data-ref="' + _.escape(dashTag) + '">Copy</button>' +
                            '</div>' +
                        '</div>' +
                        '<div style="margin-bottom:16px">' +
                            '<h4 style="color:#17A2B8;margin:0 0 10px;font-size:13px;">Or append to existing tag</h4>' +
                            '<div class="sit-cat-code-block">' +
                                '<code>' + filePath + '</code>' +
                                '<button class="sit-cat-btn sit-cat-btn-copy-sm" data-ref="' + filePath + '">Copy</button>' +
                            '</div>' +
                        '</div>' +
                        '<div style="background:#0a0e12;border:1px solid #2b3033;border-radius:8px;padding:14px;margin-bottom:12px;">' +
                            '<p style="font-size:12px;color:#6c757d;margin:0 0 8px;"><strong style="color:#a0a0a0;">Steps:</strong> Edit &rarr; Source (&lt;/&gt;) &rarr; Paste into <code>&lt;dashboard&gt;</code> tag &rarr; Save</p>' +
                            '<p style="font-size:12px;color:#6c757d;margin:0;">Combine multiple: <code>' + attrName + '="file1.css,file2.css"</code></p>' +
                        '</div>' +
                    '</div>' +

                    // === STUDIO Panel (hidden by default) ===
                    '<div class="sit-cat-format-panel" data-format="studio" style="display:none;">' +
                        (studioOk ?
                            '<div style="margin-bottom:16px">' +
                                '<h4 style="color:#7c3aed;margin:0 0 10px;font-size:13px;">Paste into Custom CSS</h4>' +
                                '<div class="sit-cat-code-block">' +
                                    '<code>' + studioImport + '</code>' +
                                    '<button class="sit-cat-btn sit-cat-btn-copy-sm" data-ref="' + studioImport + '">Copy</button>' +
                                '</div>' +
                            '</div>' +
                            '<div style="background:#0a0e12;border:1px solid #2b3033;border-radius:8px;padding:14px;margin-bottom:12px;">' +
                                '<p style="font-size:12px;color:#6c757d;margin:0 0 10px;"><strong style="color:#a0a0a0;">Steps:</strong></p>' +
                                '<div class="sit-cat-modal-step" style="margin-bottom:8px;">' +
                                    '<div class="sit-cat-modal-step-num" style="width:24px;height:24px;min-width:24px;font-size:11px;">1</div>' +
                                    '<div class="sit-cat-modal-step-content"><p style="margin:0;">Open your Studio dashboard &rarr; click <strong>...</strong> menu &rarr; <strong>Edit CSS</strong></p></div>' +
                                '</div>' +
                                '<div class="sit-cat-modal-step" style="margin-bottom:8px;">' +
                                    '<div class="sit-cat-modal-step-num" style="width:24px;height:24px;min-width:24px;font-size:11px;">2</div>' +
                                    '<div class="sit-cat-modal-step-content"><p style="margin:0;">Paste the <code>@import</code> line at the <strong>top</strong> of the CSS editor</p></div>' +
                                '</div>' +
                                '<div class="sit-cat-modal-step">' +
                                    '<div class="sit-cat-modal-step-num" style="width:24px;height:24px;min-width:24px;font-size:11px;">3</div>' +
                                    '<div class="sit-cat-modal-step-content"><p style="margin:0;"><strong>Save</strong> &mdash; styles apply instantly</p></div>' +
                                '</div>' +
                            '</div>'
                        :
                            '<div style="background:rgba(220,53,69,0.1);border:1px solid rgba(220,53,69,0.2);border-radius:8px;padding:16px;text-align:center;">' +
                                '<p style="color:#DC3545;font-weight:600;margin:0 0 6px;font-size:14px;">Not available for Dashboard Studio</p>' +
                                '<p style="color:#a0a0a0;font-size:12px;margin:0;">This component uses JavaScript which requires Simple XML Classic dashboards. Dashboard Studio has a different JS architecture.</p>' +
                            '</div>'
                        ) +
                    '</div>' +

                    '<div class="sit-cat-modal-tip">' +
                        '<strong>Works cross-app!</strong> Reference from any dashboard on your Splunk instance.' +
                        (studioOk ? ' Works in both Classic and Dashboard Studio.' : ' Classic Simple XML only.') +
                    '</div>' +
                '</div>' +
            '</div>'
        );

        $backdrop.append($modal);
        $('body').append($backdrop);

        requestAnimationFrame(function() {
            $backdrop.addClass('sit-cat-modal-visible');
        });

        function closeModal() {
            $backdrop.removeClass('sit-cat-modal-visible');
            setTimeout(function() { $backdrop.remove(); }, 300);
        }

        // Format tab switching (Classic / Studio)
        $backdrop.find('.sit-cat-format-tab').on('click', function() {
            if ($(this).prop('disabled')) return;
            var format = $(this).data('format');
            $backdrop.find('.sit-cat-format-tab').each(function() {
                if ($(this).data('format') === format) {
                    $(this).css({ background: format === 'studio' ? '#7c3aed' : '#FD1875', color: '#fff' }).addClass('sit-cat-format-tab-active');
                } else {
                    $(this).css({ background: '#2b3033', color: '#a0a0a0' }).removeClass('sit-cat-format-tab-active');
                }
            });
            $backdrop.find('.sit-cat-format-panel').hide();
            $backdrop.find('.sit-cat-format-panel[data-format="' + format + '"]').show();
        });

        $backdrop.find('.sit-cat-modal-close').on('click', closeModal);
        $backdrop.on('click', function(e) {
            if ($(e.target).is('.sit-cat-modal-backdrop')) closeModal();
        });
        $(document).on('keydown.sit-modal', function(e) {
            if (e.key === 'Escape') {
                closeModal();
                $(document).off('keydown.sit-modal');
            }
        });
    }

    // ========================================
    // Main Render
    // ========================================

    function renderCatalog() {
        var $container = $('#sit-catalog-container');
        if ($container.length === 0) return;

        // Header
        var html = '<div class="sit-cat-header">' +
            '<h1 class="sit-cat-title">Component Catalog</h1>' +
            '<p class="sit-cat-subtitle">' + getTotalCount() + ' production-ready components. Browse, preview, and copy.</p>' +
        '</div>';

        // Search
        html += renderSearch();

        // Tabs
        html += renderTabs();

        // Grid
        html += '<div class="sit-cat-grid">';
        Object.keys(components).forEach(function(category) {
            html += renderCategory(category, components[category]);
        });
        html += '</div>';

        $container.html(html);

        // ========================================
        // Event Handlers
        // ========================================

        // Tab switching
        $container.on('click', '.sit-cat-tab', function() {
            var category = $(this).data('category');
            $container.find('.sit-cat-tab').removeClass('sit-cat-tab-active');
            $(this).addClass('sit-cat-tab-active');

            if (category === 'all') {
                $container.find('.sit-cat-card').show();
            } else {
                $container.find('.sit-cat-card').hide();
                $container.find('.sit-cat-card[data-category="' + category + '"]').show();
            }
        });

        // Search
        $container.on('input', '.sit-cat-search', function() {
            var query = $(this).val().toLowerCase();
            var visibleCount = 0;

            $container.find('.sit-cat-card').each(function() {
                var $card = $(this);
                var name = $card.data('name').toLowerCase();
                var text = $card.text().toLowerCase();
                var match = query === '' || name.indexOf(query) > -1 || text.indexOf(query) > -1;
                $card.toggle(match);
                if (match) visibleCount++;
            });

            $container.find('.sit-cat-search-count').text(
                query ? visibleCount + ' of ' + getTotalCount() : ''
            );

            // Reset tab to "All" when searching
            if (query) {
                $container.find('.sit-cat-tab').removeClass('sit-cat-tab-active');
                $container.find('.sit-cat-tab[data-category="all"]').addClass('sit-cat-tab-active');
            }
        });

        // Copy button
        $container.on('click', '.sit-cat-btn-copy, .sit-cat-btn-copy-sm', function(e) {
            e.stopPropagation();
            var ref = $(this).data('ref');
            var $btn = $(this);

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(ref).then(function() {
                    showCopyFeedback($btn);
                });
            } else {
                var textarea = document.createElement('textarea');
                textarea.value = ref;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showCopyFeedback($btn);
            }
        });

        // Info/instructions button
        $container.on('click', '.sit-cat-btn-info', function(e) {
            e.stopPropagation();
            var category = $(this).data('category');
            var name = $(this).data('name');
            showInstructionsModal(category, name);
        });
    }

    function showCopyFeedback($btn) {
        var origHtml = $btn.html();
        $btn.html('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!');
        $btn.addClass('sit-cat-btn-copied');
        setTimeout(function() {
            $btn.html(origHtml);
            $btn.removeClass('sit-cat-btn-copied');
        }, 2000);
    }

    // ========================================
    // Inject Preview Animations
    // ========================================

    (function injectPreviewAnimations() {
        if (document.getElementById('sit-cat-preview-animations')) return;
        var style = document.createElement('style');
        style.id = 'sit-cat-preview-animations';
        style.textContent =
            '@keyframes sit-cat-mesh{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}' +
            '@keyframes sit-cat-aurora{0%{transform:translateX(-10%) rotate(-3deg)}100%{transform:translateX(10%) rotate(3deg)}}' +
            '@keyframes sit-cat-rain{0%{transform:translateY(-10px);opacity:0}10%{opacity:1}90%{opacity:0.5}100%{transform:translateY(85px);opacity:0}}' +
            '@keyframes sit-cat-wave{0%{transform:rotate(0deg)}50%{transform:rotate(3deg)}100%{transform:rotate(0deg)}}' +
            '@keyframes sit-cat-pulse-line{0%,100%{opacity:0.2;transform:scaleX(0.8)}50%{opacity:0.6;transform:scaleX(1)}}' +
            '@keyframes sit-cat-twinkle{0%,100%{opacity:1}50%{opacity:0.3}}' +
            '@keyframes sit-cat-radar{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}' +
            '@keyframes sit-cat-grain{0%{transform:translate(0,0)}25%{transform:translate(-2px,2px)}50%{transform:translate(2px,-2px)}75%{transform:translate(-2px,-2px)}100%{transform:translate(0,0)}}' +
            '@keyframes sit-cat-neon-glow{0%{box-shadow:0 0 10px rgba(0,255,255,0.2),inset 0 0 10px rgba(0,255,255,0.03)}100%{box-shadow:0 0 20px rgba(0,255,255,0.4),inset 0 0 20px rgba(0,255,255,0.08)}}' +
            '@keyframes sit-cat-flip{0%,100%{transform:rotateY(0deg)}50%{transform:rotateY(15deg)}}' +
            '@keyframes sit-cat-counter-bar{0%{width:0}100%{width:40px}}' +
            '@keyframes sit-cat-progress{0%{stroke-dashoffset:80}100%{stroke-dashoffset:20}}' +
            '@keyframes sit-cat-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}' +
            '@keyframes sit-cat-confetti{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(70px) rotate(360deg);opacity:0}}' +
            '@keyframes sit-cat-ticker{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}' +
            '@keyframes sit-cat-sun{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.1) rotate(10deg)}}' +
            '@keyframes sit-cat-needle{0%{transform:rotate(-30deg)}100%{transform:rotate(30deg)}}' +
            '@keyframes sit-cat-countdown{0%{stroke-dashoffset:0}100%{stroke-dashoffset:138}}' +
            '@keyframes sit-cat-fadein{0%{opacity:0}50%,100%{opacity:1}}' +
            '@keyframes sit-cat-slideup{0%{opacity:0;transform:translateY(15px)}50%,100%{opacity:1;transform:translateY(0)}}' +
            '@keyframes sit-cat-lift{0%,100%{transform:scale(1.05);box-shadow:0 8px 24px rgba(0,0,0,0.4)}50%{transform:scale(1);box-shadow:0 2px 8px rgba(0,0,0,0.2)}}' +
            '@keyframes sit-cat-glow-border{0%{box-shadow:0 0 8px rgba(253,24,117,0.2);border-color:rgba(253,24,117,0.3)}100%{box-shadow:0 0 20px rgba(253,24,117,0.5);border-color:rgba(253,24,117,0.6)}}' +
            '@keyframes sit-cat-ripple{0%{transform:translate(-50%,-50%) scale(0);opacity:0.5}100%{transform:translate(-50%,-50%) scale(4);opacity:0}}' +
            '@keyframes sit-cat-blink{0%,100%{border-color:#FD1875}50%{border-color:transparent}}' +
            '@keyframes sit-cat-typewriter{0%{width:0}50%,100%{width:60px}}' +
            '@keyframes sit-cat-count{0%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}' +
            '@keyframes sit-cat-pulse-dot{0%,100%{transform:scale(1);box-shadow:0 0 8px rgba(255,68,68,0.5)}50%{transform:scale(1.3);box-shadow:0 0 16px rgba(255,68,68,0.8)}}' +
            '@keyframes sit-cat-stagger{0%{opacity:0;transform:scale(0.8)}50%,100%{opacity:1;transform:scale(1)}}' +
            '@keyframes sit-cat-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}' +
            '@keyframes sit-cat-pulse{0%,100%{opacity:1}50%{opacity:0.5}}';
        document.head.appendChild(style);
    })();

    // ========================================
    // Initialize
    // ========================================

    renderCatalog();

    // Expose for Design Center
    window.SIT = window.SIT || {};
    window.SIT.catalogComponents = components;
});
