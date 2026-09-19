window.__ModuleLoader__.load({
	id: 'dsh-auto-compact',
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
		let React = require('react');

		//#region dsh-auto-compact client
		const CSS_ID = 'dsh-auto-compact/styles';
		const css = `.ac-ring{position:relative;display:inline-flex;align-items:center}
.ac-trigger{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:transparent;border:none;border-radius:999px;flex:none;place-items:center;display:grid;padding:0;margin-right:-4px}
.ac-trigger:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ac-trigger:focus-visible{outline:2px solid var(--dsw-alias-border-l3);outline-offset:-2px}
.ac-track{fill:none;stroke:var(--dsw-alias-border-l3);stroke-width:2px}
.ac-arc-threshold{fill:none;stroke:var(--dsw-alias-state-warn-primary,#f59e0b);stroke-width:2px;stroke-linecap:round}
.ac-arc-usage-low{fill:none;stroke:var(--dsw-alias-state-success-primary,#22c55e);stroke-width:2px;stroke-linecap:round}
.ac-arc-usage-mid{fill:none;stroke:var(--dsw-alias-state-warn-primary,#f59e0b);stroke-width:2px;stroke-linecap:round}
.ac-arc-usage-high{fill:none;stroke:var(--dsw-alias-state-error-primary,#ef4444);stroke-width:2px;stroke-linecap:round}
.ac-panel{z-index:100;box-sizing:border-box;border:1px solid var(--dsw-alias-border-inverted);background:var(--dsw-specific-menu);width:248px;box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-secondary);cursor:default;border-radius:12px;padding:12px;font-size:12px;line-height:20px;position:absolute;bottom:calc(100% + 8px);right:0}
.ac-panel-title{color:var(--dsw-alias-label-primary);font-weight:500;font-size:13px}
.ac-slider{width:100%;accent-color:var(--dsw-alias-state-warn-primary,#f59e0b);margin:10px 0 4px}
.ac-panel-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:2px 0}
.ac-panel-value{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-weight:500}
.ac-panel-hint{color:var(--dsw-alias-label-caption);margin-top:8px;font-size:11px;line-height:16px}`;
		if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="' + CSS_ID + '"]') === null) {
			const tag = document.createElement('style');
			tag.setAttribute('data-plugin-css', CSS_ID);
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		const RADIUS = 6.5;
		const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

		function makeArc(ratio) {
			return (CIRCUMFERENCE * ratio).toFixed(2) + ' ' + CIRCUMFERENCE.toFixed(2);
		}

		function usageColorClass(percent) {
			if (percent == null) return 'ac-arc-threshold';
			if (percent < 50) return 'ac-arc-usage-low';
			if (percent < 80) return 'ac-arc-usage-mid';
			return 'ac-arc-usage-high';
		}

		const inject = ['slots'];

		function apply(ctx) {
			const slots = ctx.get('slots');
			if (slots === void 0) return;

			const readThresholds = async () => {
				try {
					const response = await fetch('/dsh-auto-compact/api/thresholds.get', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
					const parsed = await response.json().catch(() => null);
					if (!response.ok || !parsed || parsed.ok !== true || typeof parsed.value !== 'object' || parsed.value === null) return {};
					const out = {};
					for (const key of Object.keys(parsed.value)) {
						const n = Number(parsed.value[key]);
						if (Number.isFinite(n) && n > 0 && n <= 1) out[key] = n;
					}
					return out;
				} catch (error) {
					return {};
				}
			};

			const writeRatio = async (sessionId, ratio) => {
				try {
					await fetch('/dsh-auto-compact/api/thresholds.set', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ sessionId, ratio })
					});
				} catch (error) { /* ignore */ }
			};

			slots.inject('conversation.input.right', () => slots.register(
				{ name: 'conversation.input.right', id: 'dsh-auto-compact-ring', order: 10 },
				(props) => {
					const sessionId = props && (props.sessionId || (props.session && props.session.sessionId));
					if (!sessionId) return null;
					const useProjection = props && props.useProjection;
					const [open, setOpen] = React.useState(false);
					const [ratio, setRatio] = React.useState(0.7);

					// Real-time usage from contextPressure projection
					const pressure = useProjection ? useProjection('contextPressure') : null;
					const usedTokens = pressure == null ? void 0 : (pressure.projectedTokens ?? pressure.pressureTokens);
					const contextWindow = pressure == null ? void 0 : pressure.contextWindow;
					const usagePercent = usedTokens != null && contextWindow != null && contextWindow > 0
						? Math.min(100, Math.round(usedTokens / contextWindow * 100))
						: null;

					// Load session threshold on mount
					React.useEffect(() => {
						let alive = true;
						readThresholds().then((thresholds) => {
							const value = thresholds[sessionId];
							if (alive && typeof value === 'number') setRatio(value);
						}).catch(() => {});
						return () => { alive = false; };
					}, [sessionId]);

					const percent = Math.round(ratio * 100);
					const thresholdArc = makeArc(ratio);
					const usageArc = usagePercent != null ? makeArc(usagePercent / 100) : '0 ' + CIRCUMFERENCE.toFixed(2);
					const usageClass = usageColorClass(usagePercent);

					return React.createElement('span', {
						className: 'ac-ring',
					},
						// Left ring: current context usage
						React.createElement('button', {
							type: 'button',
							className: 'ac-trigger',
							'aria-label': 'Context usage ' + (usagePercent != null ? usagePercent + '%' : 'unknown'),
							title: 'Context usage: ' + (usagePercent != null ? usagePercent + '%' : 'unknown'),
							onClick: () => setOpen(!open),
						},
							React.createElement('svg', { viewBox: '0 0 18 18', width: 16, height: 16, 'aria-hidden': true },
								React.createElement('circle', { className: 'ac-track', cx: 9, cy: 9, r: RADIUS }),
								React.createElement('circle', { className: usageClass, cx: 9, cy: 9, r: RADIUS, strokeDasharray: usageArc, transform: 'rotate(-90 9 9)' }),
							),
						),
						// Right ring: auto-compact threshold setting
						React.createElement('button', {
							type: 'button',
							className: 'ac-trigger',
							'aria-label': 'Auto-compact threshold ' + percent + '%',
							'aria-expanded': open,
							title: 'Auto-compact threshold: ' + percent + '%',
							onClick: () => setOpen(!open),
						},
							React.createElement('svg', { viewBox: '0 0 18 18', width: 16, height: 16, 'aria-hidden': true },
								React.createElement('circle', { className: 'ac-track', cx: 9, cy: 9, r: RADIUS }),
								React.createElement('circle', { className: 'ac-arc-threshold', cx: 9, cy: 9, r: RADIUS, strokeDasharray: thresholdArc, transform: 'rotate(-90 9 9)' }),
							),
						),
						open && React.createElement('div', { className: 'ac-panel', role: 'dialog' },
							React.createElement('div', { className: 'ac-panel-title' }, 'Auto-Compact Threshold'),
							React.createElement('input', {
								type: 'range',
								className: 'ac-slider',
								min: 1,
								max: 90,
								step: 1,
								value: percent,
								onChange: (e) => {
									const next = Number(e.target.value) / 100;
									setRatio(next);
									writeRatio(sessionId, next);
								},
							}),
							contextWindow != null && React.createElement('div', { className: 'ac-panel-row' },
								React.createElement('span', null, 'Trigger threshold'),
								React.createElement('strong', { className: 'ac-panel-value' }, percent + '% (' + Math.round(ratio * contextWindow).toLocaleString() + ' tokens)'),
							),
							usagePercent != null && React.createElement('div', { className: 'ac-panel-row' },
								React.createElement('span', null, 'Current usage'),
								React.createElement('span', { className: 'ac-panel-value' }, usagePercent + '% (' + usedTokens.toLocaleString() + '/' + contextWindow.toLocaleString() + ')'),
							),
							React.createElement('div', { className: 'ac-panel-hint' }, 'Auto-compact before each step and at turn end when threshold is exceeded; summary injected into context to continue'),
						),
					);
				},
			));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});