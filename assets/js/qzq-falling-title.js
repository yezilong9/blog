(function () {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var Matter = window.Matter;
    var stage = document.querySelector('[data-qzq-falling-stage]');

    if (!stage || reduceMotion || !Matter) return;

    var Engine = Matter.Engine;
    var Runner = Matter.Runner;
    var Bodies = Matter.Bodies;
    var Composite = Matter.Composite;
    var Body = Matter.Body;
    var Events = Matter.Events;
    var Mouse = Matter.Mouse;
    var MouseConstraint = Matter.MouseConstraint;

    var engine;
    var runner;
    var frameId;
    var bodies = [];
    var walls = [];
    var layer;
    var source;
    var hasStarted = false;

    function splitGraphemes(text) {
        if (window.Intl && Intl.Segmenter) {
            return Array.from(new Intl.Segmenter('zh-CN', { granularity: 'grapheme' }).segment(text), function (part) {
                return part.segment;
            });
        }

        return Array.from(text);
    }

    function clearWorld() {
        if (frameId) {
            window.cancelAnimationFrame(frameId);
            frameId = null;
        }

        if (runner) {
            Runner.stop(runner);
            runner = null;
        }

        if (engine) {
            Composite.clear(engine.world, false);
            Engine.clear(engine);
            engine = null;
        }

        bodies = [];
        walls = [];

        if (layer) {
            layer.remove();
            layer = null;
        }

        stage.classList.remove('is-physics-active');
    }

    function ensureSource() {
        if (source) return source;

        source = document.createElement('div');
        source.className = 'qzq-falling-source';

        Array.from(stage.children).forEach(function (child) {
            source.appendChild(child);
        });

        stage.appendChild(source);
        return source;
    }

    function createTokenElement(char, sourceElement) {
        var token = document.createElement('span');
        token.className = 'qzq-physics-token';
        token.textContent = char;

        var computed = window.getComputedStyle(sourceElement);
        token.style.font = computed.font;
        token.style.fontSize = computed.fontSize;
        token.style.fontWeight = computed.fontWeight;
        token.style.lineHeight = computed.lineHeight;
        token.style.letterSpacing = computed.letterSpacing;
        token.style.color = computed.color;

        return token;
    }

    function buildTokens() {
        var stageRect = stage.getBoundingClientRect();
        var lines = stage.querySelectorAll('[data-qzq-falling-line]');
        var tokens = [];

        lines.forEach(function (line) {
            var text = line.textContent;
            var chars = splitGraphemes(text);
            var range = document.createRange();

            chars.forEach(function (char, index) {
                if (/\s/.test(char)) return;

                range.setStart(line.firstChild || line, index);
                range.setEnd(line.firstChild || line, index + 1);

                var rect = range.getBoundingClientRect();
                if (!rect.width || !rect.height) return;

                tokens.push({
                    char: char,
                    element: createTokenElement(char, line),
                    x: rect.left - stageRect.left + rect.width / 2,
                    y: rect.top - stageRect.top + rect.height / 2,
                    width: Math.max(rect.width, 8),
                    height: Math.max(rect.height, 8)
                });
            });

            range.detach();
        });

        return tokens;
    }

    function addBoundaries(width, height) {
        var thickness = 80;

        walls = [
            Bodies.rectangle(width / 2, height + thickness / 2, width + thickness * 2, thickness, { isStatic: true }),
            Bodies.rectangle(-thickness / 2, height / 2, thickness, height + thickness * 2, { isStatic: true }),
            Bodies.rectangle(width + thickness / 2, height / 2, thickness, height + thickness * 2, { isStatic: true })
        ];

        Composite.add(engine.world, walls);
    }

    function startPhysics(force) {
        if (hasStarted && !force) return;
        hasStarted = true;

        clearWorld();

        ensureSource();

        var rect = stage.getBoundingClientRect();
        var tokens = buildTokens();

        if (!tokens.length || rect.width <= 0 || rect.height <= 0) return;

        layer = document.createElement('div');
        layer.className = 'qzq-physics-layer';
        stage.appendChild(layer);

        engine = Engine.create();
        engine.gravity.y = 0.35;
        engine.gravity.x = 0;

        addBoundaries(rect.width, rect.height);

        bodies = tokens.map(function (token) {
            layer.appendChild(token.element);

            var body = Bodies.rectangle(token.x, token.y, token.width, token.height, {
                restitution: 0.72,
                friction: 0.22,
                frictionAir: 0.012,
                chamfer: { radius: 4 }
            });

            Body.setVelocity(body, {
                x: (Math.random() - 0.5) * 4,
                y: -7 - Math.random() * 7
            });
            Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.24);

            body.plugin = { element: token.element };
            return body;
        });

        Composite.add(engine.world, bodies);

        var mouse = Mouse.create(stage);
        var mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.18,
                render: { visible: false }
            }
        });

        Composite.add(engine.world, mouseConstraint);
        stage.classList.add('is-physics-active');

        Events.on(engine, 'afterUpdate', function () {
            bodies.forEach(function (body) {
                var el = body.plugin.element;
                el.style.transform = 'translate3d(' + (body.position.x - el.offsetWidth / 2) + 'px, ' + (body.position.y - el.offsetHeight / 2) + 'px, 0) rotate(' + body.angle + 'rad)';
            });
        });

        runner = Runner.create();
        Runner.run(runner, engine);
    }

    stage.addEventListener('pointerenter', function () {
        startPhysics(false);
    }, { once: true });

    stage.addEventListener('mouseenter', function () {
        startPhysics(false);
    }, { once: true });

    function handleMove(event) {
        var rect = stage.getBoundingClientRect();
        var x = event.clientX;
        var y = event.clientY;

        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            startPhysics(false);
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('pointermove', handleMove);
        }
    }

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('pointermove', handleMove);

    stage.addEventListener('touchstart', function () {
        startPhysics(false);
    }, { once: true, passive: true });

    window.addEventListener('resize', function () {
        if (stage.classList.contains('is-physics-active')) {
            startPhysics(true);
        }
    });
})();
