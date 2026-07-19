
    document.addEventListener('DOMContentLoaded', () => {
      let state = getState();
      
      if (!state.part) { window.location.href = 'step1.html'; return; }

      function updateTitle(i18nKey) {
        const span = document.getElementById('title-span');
        span.setAttribute('data-i18n', i18nKey);
        applyLanguageToUI();
      }

      const showFlow = (id) => {
        document.querySelectorAll('.hurt-flow').forEach(el => el.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
      };

      // Flow Logic
      const lang = state.lang || 'ko';
      const t = translations[lang] || translations.ko;

      if (state.sideSelect && !state.sideSelected) {
        // Step A: Arm/Leg Left/Right Selection
        const titleKey = state.sideSelect === 'arm' ? 'side_select_arm' : 'side_select_leg';
        updateTitle(titleKey);
        showFlow('side-select-flow');
        
        document.querySelectorAll('[data-side]').forEach(btn => {
          btn.onclick = (e) => {
            const side = e.currentTarget.dataset.side;
            state.sideLabel = translations.ko['side_' + side];
            state.sideSelected = true;
            saveState(state);
            location.reload();
          };
        });
      } else if (state.sideSelect === 'arm' && state.sideSelected) {
        // Step B: Arm Part Selection
        updateTitle('step_1_title');
        showFlow('arm-part-flow');
        document.querySelectorAll('#arm-part-flow [data-sub]').forEach(btn => {
          btn.onclick = (e) => {
            const subKey = e.currentTarget.dataset.sub;
            const subLabel = translations.ko[subKey];
            state.part = `팔·손 (${state.sideLabel} ${subLabel})`;
            saveState(state);
            window.location.href = 'step2.html';
          };
        });
      } else if (state.sideSelect === 'leg' && state.sideSelected) {
        // Step C: Leg Part Selection
        updateTitle('step_1_title');
        showFlow('leg-part-flow');
        document.querySelectorAll('#leg-part-flow [data-sub]').forEach(btn => {
          btn.onclick = (e) => {
            const subKey = e.currentTarget.dataset.sub;
            const subLabel = translations.ko[subKey];
            state.part = `다리·발 (${state.sideLabel} ${subLabel})`;
            saveState(state);
            window.location.href = 'step2.html';
          };
        });
      } else if (state.part === translations.ko['part_head'] && !state.headSubSelected) {
        // Head Sub Selection
        updateTitle('part_head');
        showFlow('head-pos-flow');
        document.querySelectorAll('#head-pos-flow [data-sub]').forEach(btn => {
          btn.onclick = (e) => {
            const subKey = e.currentTarget.dataset.sub;
            state.part = translations.ko[subKey];
            state.headSubSelected = true;
            saveState(state);
            window.location.href = 'step2.html';
          };
        });
      } else if (state.part === translations.ko['part_belly'] && !state.bellyPos) {
        // Belly Canvas Logic
        updateTitle('part_belly');
        showFlow('belly-pos-flow');
        
        const canvas = document.getElementById('belly-canvas');
        const ctx = canvas.getContext('2d');
        let drawing = false;
        let debounceTimer = null;
        let currentMode = 'draw';
        
        const resize = () => {
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const getPos = (e) => {
          const rect = canvas.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          return { x: clientX - rect.left, y: clientY - rect.top, cx: clientX, cy: clientY };
        };

        const startDraw = (e) => {
          e.preventDefault();
          drawing = true;
          const pos = getPos(e);
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          clearTimeout(debounceTimer);
          // 이전 영역 해제하지 않음 (새로 그린다고 지워지지 않게 유지)
          // 단, 현재 모드가 'erase'이면 클릭한 영역의 하이라이트도 지울 수 있도록 나중에 처리할 수 있지만, 우선은 캔버스만 지우게 둠
        };

        const draw = (e) => {
          if (!drawing) return;
          e.preventDefault();
          const pos = getPos(e);
          ctx.lineTo(pos.x, pos.y);
          ctx.globalCompositeOperation = currentMode === 'erase' ? 'destination-out' : 'source-over';
          ctx.strokeStyle = currentMode === 'erase' ? 'rgba(0,0,0,1)' : 'rgba(255, 107, 107, 0.8)'; 
          ctx.lineWidth = currentMode === 'erase' ? 40 : 20;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        };

        const evaluateCanvas = () => {
          canvas.style.pointerEvents = 'none'; // Temporarily disable to hit SVG
          const rect = canvas.getBoundingClientRect();
          
          let hitCounts = {};
          let totalHits = 0;
          
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let y = 0; y < canvas.height; y += 10) {
              for (let x = 0; x < canvas.width; x += 10) {
                const idx = (y * canvas.width + x) * 4;
                if (data[idx + 3] > 0) { // Painted pixel
                  const el = document.elementFromPoint(rect.left + x, rect.top + y);
                  if (el && el.classList.contains('belly-area')) {
                    const sub = el.getAttribute('data-sub');
                    hitCounts[sub] = (hitCounts[sub] || 0) + 1;
                    totalHits++;
                  }
                }
              }
            }
          } catch(e) {
             console.error("Canvas read error:", e);
          }
          
          canvas.style.pointerEvents = 'auto'; // Re-enable
          
          if (totalHits > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // 그림 지우기
            
            // 모든 칠해진 구역(10% 이상) 가져오기
            const activeRegions = [];
            for (const [sub, count] of Object.entries(hitCounts)) {
              if (count > totalHits * 0.1) {
                activeRegions.push(sub);
              }
            }
            
            if (activeRegions.length > 0) {
              activeRegions.forEach(sub => {
                  const svgEl = document.querySelector(`.belly-area[data-sub="${sub}"]`);
                  if (currentMode === 'erase') {
                      svgEl.classList.remove('highlight', 'highlight-danger');
                  } else {
                      if (sub === 'belly_right_bottom') svgEl.classList.add('highlight-danger');
                      else svgEl.classList.add('highlight');
                  }
              });
            }
          }
          
          // Canvas와 무관하게 현재 SVG에 활성화된 모든 구역을 기준으로 Queue 생성
          const allActive = [];
          document.querySelectorAll('.belly-area').forEach(el => {
              if (el.classList.contains('highlight') || el.classList.contains('highlight-danger')) {
                  allActive.push(el.getAttribute('data-sub'));
              }
          });

          if (allActive.length > 0) {
              const count = allActive.length;
              if (count === 4) {
                 state.partsQueue = [{ id: 'belly_all', name: '복부 전체', lookupPart: '배' }];
              } else if (count === 1) {
                 const r = allActive[0];
                 const lookup = r.includes('top') ? '윗배' : '아랫배';
                 state.partsQueue = [{ id: r, name: r, lookupPart: lookup }];
              } else {
                 // 2~3개
                 const hasTop = allActive.some(r => r.includes('top'));
                 const hasBottom = allActive.some(r => r.includes('bottom'));
                 state.partsQueue = [];
                 if (hasTop) state.partsQueue.push({ id: 'belly_top_all', name: '윗배 전체', lookupPart: '윗배' });
                 if (hasBottom) state.partsQueue.push({ id: 'belly_bottom_all', name: '아랫배 전체', lookupPart: '아랫배' });
              }
              document.getElementById('btn-belly-done').style.display = 'block';
          } else {
              state.partsQueue = null;
              document.getElementById('btn-belly-done').style.display = 'none';
          }
          }
        };

        const stopDraw = () => {
          if (!drawing) return;
          drawing = false;
          debounceTimer = setTimeout(evaluateCanvas, 500);
        };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stopDraw);
        
        canvas.addEventListener('touchstart', startDraw, {passive: false});
        canvas.addEventListener('touchmove', draw, {passive: false});
        window.addEventListener('touchend', stopDraw);
        
        document.getElementById('btn-draw-mode').onclick = () => {
          currentMode = 'draw';
          document.getElementById('btn-draw-mode').className = 'btn btn-primary';
          document.getElementById('btn-erase-mode').className = 'btn btn-secondary';
        };
        
        document.getElementById('btn-erase-mode').onclick = () => {
          currentMode = 'erase';
          document.getElementById('btn-erase-mode').className = 'btn btn-primary';
          document.getElementById('btn-draw-mode').className = 'btn btn-secondary';
        };
        
        document.getElementById('btn-clear-all').onclick = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          document.querySelectorAll('.belly-area').forEach(el => {
            el.classList.remove('highlight', 'highlight-danger');
          });
          document.getElementById('btn-belly-done').style.display = 'none';
          state.partsQueue = null;
        };
        
        document.getElementById('btn-belly-done').onclick = () => {
          if (state.bellyPos) {
            saveState(state);
            window.location.href = 'step2.html';
          }
        };
      } else {
        window.location.href = 'step2.html';
      }

      // I don't know button
      document.querySelector('.btn-idk').addEventListener('click', () => {
        if (state.part === translations.ko['part_head']) {
          state.headSubSelected = true;
        } else if (state.part === translations.ko['part_belly']) {
          state.partsQueue = [{ id: 'idk', name: translations.ko['idk'], lookupPart: '배' }];
        } else if (state.sideSelect) {
          if (!state.sideSelected) {
             state.sideSelected = true;
             state.sideLabel = translations.ko['idk'];
             saveState(state);
             location.reload();
             return;
          } else {
             state.part = `${state.sideSelect === 'arm' ? '팔·손' : '다리·발'} (${state.sideLabel} ${translations.ko['idk']})`;
          }
        }
        saveState(state);
        window.location.href = 'step2.html';
      });

      // Back Button
      document.getElementById('btn-back').addEventListener('click', () => {
        if (state.sideSelect && state.sideSelected) {
          state.sideSelected = false;
          state.sideLabel = null;
          saveState(state);
          location.reload();
        } else {
          window.location.href = 'step1.html';
        }
      });

      applyLanguageToUI();
    });
  