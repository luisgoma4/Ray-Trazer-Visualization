class RayTracerVisualization {
    constructor() {
        this.canvas = document.getElementById('rayCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.data = null;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.setupEventListeners();
        this.loadData();
    }
    
    async loadData() {
        try {
            // Load both ray data and medium data concurrently
            const [rayResponse, mediumResponse] = await Promise.all([
                fetch('ray_data.json'),
                fetch('medium_data.json')
            ]);
            
            if (!rayResponse.ok) {
                throw new Error(`HTTP error loading ray data! status: ${rayResponse.status}`);
            }
            if (!mediumResponse.ok) {
                throw new Error(`HTTP error loading medium data! status: ${mediumResponse.status}`);
            }
            
            const rayData = await rayResponse.json();
            const mediumData = await mediumResponse.json();
            
            // Merge the data to maintain compatibility with existing code
            this.data = {
                ...rayData,
                parameters: mediumData.parameters,
                medium: mediumData.medium
            };
            
            this.updateInfoPanels();
            this.setupCanvas();
            this.draw();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Error al cargar los datos: ' + error.message);
        }
    }
    
    setupEventListeners() {
        // Controles de visualización
        document.getElementById('showRays').addEventListener('change', () => this.draw());
        document.getElementById('showMedium').addEventListener('change', () => this.draw());
        document.getElementById('showEndpoints').addEventListener('change', () => this.draw());
        document.getElementById('showProjections').addEventListener('change', () => this.draw());
        document.getElementById('showMeanCircle').addEventListener('change', () => this.draw());
        document.getElementById('showConnectionCurve').addEventListener('change', () => this.draw());
        
        // Control de opacidad
        const opacitySlider = document.getElementById('rayOpacity');
        opacitySlider.addEventListener('input', (e) => {
            document.getElementById('opacityValue').textContent = e.target.value;
            this.draw();
        });
        
        // Control de zoom (slider) anclado al centro del canvas
        const zoomSlider = document.getElementById('zoomLevel');
        const zoomValue  = document.getElementById('zoomValue');

        if (zoomSlider) {
        zoomSlider.min = '1';
        zoomSlider.max = '20';
        zoomSlider.step = '0.1';
        zoomSlider.value = String(this.scale);
        }
        if (zoomValue) {
        zoomValue.textContent = Number(this.scale).toFixed(1);
        }

        zoomSlider?.addEventListener('input', (e) => {
        // Ancla el zoom al punto focal: el origen del mundo (0,0)
        const [sx, sy] = this.worldToCanvas(0, 0);
        const used = this.zoomAt(sx, sy, parseFloat(e.target.value));
        zoomSlider.value = String(used);
        if (zoomValue) zoomValue.textContent = Number(used).toFixed(1);
        });
        
        // Eventos de mouse para pan
        this.canvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.canvas.addEventListener('mousemove', (e) => this.drag(e));
        this.canvas.addEventListener('mouseup', () => this.endDrag());
        this.canvas.addEventListener('mouseleave', () => this.endDrag());
        
        // Zoom con rueda del mouse
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }
    
    setupCanvas() {
        if (!this.data) return;
        
        // Calcular límites basados en el tamaño del dominio
        const size = this.data.parameters.size || 10;
        this.domainSize = size;
        
        // Centrar la vista
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
    }
    
    worldToCanvas(x, y) {
        const canvasX = this.offsetX + (x * this.scale * this.canvas.width) / (2 * this.domainSize);
        const canvasY = this.offsetY - (y * this.scale * this.canvas.height) / (2 * this.domainSize);
        return [canvasX, canvasY];
    }

    canvasToWorld(sx, sy) {
        // Inversa de worldToCanvas, usando la escala y offsets actuales
        const ax = (this.scale * this.canvas.width) / (2 * this.domainSize);
        const ay = (this.scale * this.canvas.height) / (2 * this.domainSize);
        const x = (sx - this.offsetX) / ax;
        const y = (this.offsetY - sy) / ay;
        return { x, y };
    }

    // Aplica zoom manteniendo fijo el punto de pantalla (sx, sy)
    zoomAt(sx, sy, newScale) {
        const MIN = 1;
        const MAX = 20;
        const clamped = Math.max(MIN, Math.min(MAX, newScale));

        // Punto del mundo bajo el ancla, con la escala actual
        const world = this.canvasToWorld(sx, sy);

        // Actualiza escala (clamp) y recalcula offsets para mantener el ancla
        this.scale = clamped;
        const axNew = (this.scale * this.canvas.width) / (2 * this.domainSize);
        const ayNew = (this.scale * this.canvas.height) / (2 * this.domainSize);
        this.offsetX = sx - world.x * axNew;
        this.offsetY = sy + world.y * ayNew;

        this.draw();
        return this.scale; // devuelve la escala efectiva usada
    }
    
    draw() {
        if (!this.data) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar fondo con grid
        this.drawGrid();
        
        // Dibujar elementos según los controles
        if (document.getElementById('showMedium').checked) {
            this.drawMedium();
        }
        
        if (document.getElementById('showRays').checked) {
            this.drawRays();
        }
        
        if (document.getElementById('showMeanCircle').checked) {
            this.drawMeanCircle();
        }
        
        if (document.getElementById('showProjections').checked) {
            this.drawProjections();
        }
        
        if (document.getElementById('showEndpoints').checked) {
            this.drawEndpoints();
        }
        
        if (document.getElementById('showConnectionCurve').checked) {
            this.drawConnectionCurve();
        }
        // Dibuja el punto focal (origen del mundo)
        if (typeof this.drawFocusPoint === 'function') this.drawFocusPoint();
    }
    // --- Punto focal en el origen del mundo (0,0) ---
drawFocusPoint() {
        const [cx, cy] = this.worldToCanvas(0, 0);
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = '#ff2d55';
        ctx.strokeStyle = '#ff2d55';
        ctx.lineWidth = 1;
        // círculo (radio fijo en píxeles para evitar dependencias)
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        // cruz opcional
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy);
        ctx.lineTo(cx + 10, cy);
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx, cy + 10);
        ctx.stroke();
        ctx.restore();
        }
    
    drawGrid() {
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;
        
        const gridSpacing = (this.canvas.width * this.scale) / (4 * this.domainSize);
        
        // Líneas verticales
        for (let x = 0; x < this.canvas.width; x += gridSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Líneas horizontales
        for (let y = 0; y < this.canvas.height; y += gridSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Ejes principales
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 2;
        
        // Eje X
        const [centerX, centerY] = this.worldToCanvas(0, 0);
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(this.canvas.width, centerY);
        this.ctx.stroke();
        
        // Eje Y
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, this.canvas.height);
        this.ctx.stroke();
    }
    
    drawMedium() {
        if (!this.data.medium || this.data.medium.length === 0) return;
        
        const minN = this.data.parameters.min_n;
        const maxN = this.data.parameters.max_n;
        const nRange = maxN - minN;
        
        this.data.medium.forEach(particle => {
            const [canvasX, canvasY] = this.worldToCanvas(particle.x, particle.y);
            const radius = (particle.radius * this.scale * this.canvas.width) / (2 * this.domainSize);
            
            // Color basado en el índice de refracción
            const nNorm = nRange > 0 ? (particle.n - minN) / nRange : 0;
            const blue = Math.floor(255 * (0.3 + 0.7 * nNorm));
            
            // Dibujar círculo
            this.ctx.fillStyle = `rgba(0, 0, ${blue}, 0.6)`;
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 0.5;
            
            this.ctx.beginPath();
            this.ctx.arc(canvasX, canvasY, Math.max(1, radius), 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Punto central
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(canvasX, canvasY, 1, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    drawRays() {
        if (!this.data.rays || this.data.rays.length === 0) return;
        
        const opacity = document.getElementById('rayOpacity').value;
        this.ctx.strokeStyle = `rgba(0, 123, 255, ${opacity})`;
        this.ctx.lineWidth = 0.7;
        
        this.data.rays.forEach(ray => {
            if (ray.length < 2) return;
            
            this.ctx.beginPath();
            const [startX, startY] = this.worldToCanvas(ray[0][0], ray[0][1]);
            this.ctx.moveTo(startX, startY);
            
            for (let i = 1; i < ray.length; i++) {
                const [x, y] = this.worldToCanvas(ray[i][0], ray[i][1]);
                this.ctx.lineTo(x, y);
            }
            
            this.ctx.stroke();
        });
    }
    
    drawEndpoints() {
        if (!this.data.endpoints || this.data.endpoints.length === 0) return;
        
        this.ctx.fillStyle = '#dc3545';
        
        this.data.endpoints.forEach(endpoint => {
            const [canvasX, canvasY] = this.worldToCanvas(endpoint[0], endpoint[1]);
            
            this.ctx.beginPath();
            this.ctx.arc(canvasX, canvasY, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    drawProjections() {
        if (!this.data.projections || this.data.projections.length === 0) return;
        
        this.ctx.fillStyle = '#007bff';
        
        this.data.projections.forEach(projection => {
            const [canvasX, canvasY] = this.worldToCanvas(projection[0], projection[1]);
            
            this.ctx.beginPath();
            this.ctx.arc(canvasX, canvasY, 2, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    drawMeanCircle() {
        if (!this.data.mean_radius) return;
        
        const [centerX, centerY] = this.worldToCanvas(0, 0);
        const radius = (this.data.mean_radius * this.scale * this.canvas.width) / (2 * this.domainSize);
        
        this.ctx.strokeStyle = '#28a745';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    drawConnectionCurve() {
        if (!this.data.endpoints || this.data.endpoints.length === 0) return;
        
        this.ctx.strokeStyle = '#ff6b35';
        this.ctx.lineWidth = 1.5;
        this.ctx.globalAlpha = 0.7;
        
        // Conectar puntos finales en orden de lanzamiento
        this.ctx.beginPath();
        
        // Primer punto
        const [firstX, firstY] = this.worldToCanvas(this.data.endpoints[0][0], this.data.endpoints[0][1]);
        this.ctx.moveTo(firstX, firstY);
        
        // Conectar todos los puntos en secuencia
        for (let i = 1; i < this.data.endpoints.length; i++) {
            const [x, y] = this.worldToCanvas(this.data.endpoints[i][0], this.data.endpoints[i][1]);
            this.ctx.lineTo(x, y);
        }
        
        // Cerrar la curva conectando el último punto con el primero
        this.ctx.lineTo(firstX, firstY);
        
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
    }
    
    
    updateInfoPanels() {
        if (!this.data) return;
        
        // Parámetros de simulación
        const simParams = document.getElementById('simulationParams');
        simParams.innerHTML = `
            <p><strong>Seed:</strong> ${this.data.parameters.seed}</p>
            <p><strong>Number of particles:</strong> ${this.data.parameters.N}</p>
            <p><strong>Domain Size:</strong> ${this.data.parameters.size}</p>
            <p><strong>Refractive Index:</strong> ${this.data.parameters.min_n} - ${this.data.parameters.max_n}</p>
            <p><strong>Total Rays:</strong> ${this.data.parameters.num_rays}</p>
            <p><strong>Max Impacts:</strong> ${this.data.parameters.max_bounces}</p>
            <p><strong>Max Time:</strong> ${this.data.parameters.max_time}</p>
        `;
        
        // Estadísticas del medio
        const mediumStats = document.getElementById('mediumStats');
        if (this.data.medium && this.data.medium.length > 0) {
            const radii = this.data.medium.map(p => p.radius);
            const indices = this.data.medium.map(p => p.n);
            
            mediumStats.innerHTML = `
                <p><strong>Number of Particles:</strong> ${this.data.medium.length}</p>
                <p><strong>Average Radii:</strong> ${(radii.reduce((a, b) => a + b, 0) / radii.length).toFixed(4)}</p>
                <p><strong>Radii mín/máx:</strong> ${Math.min(...radii).toFixed(4)} / ${Math.max(...radii).toFixed(4)}</p>
                <p><strong>Average Refractive Index:</strong> ${(indices.reduce((a, b) => a + b, 0) / indices.length).toFixed(4)}</p>
            `;
        } else {
            mediumStats.innerHTML = '<p>No hay datos del medio disponibles</p>';
        }
        
        // Estadísticas de rayos
        const rayStats = document.getElementById('rayStats');
        rayStats.innerHTML = `
            <p><strong>Number of ploted rays:</strong> ${this.data.stats.num_rays}</p>
            <p><strong>Average distance to origin:</strong> ${this.data.mean_radius.toFixed(4)}</p>
            <p><strong>Final points:</strong> ${this.data.endpoints.length}</p>
            <p><strong>Proyections:</strong> ${this.data.projections.length}</p>
        `;
    }
    
    showError(message) {
        const containers = ['simulationParams', 'mediumStats', 'rayStats'];
        containers.forEach(id => {
            document.getElementById(id).innerHTML = `<div class="error">${message}</div>`;
        });
    }
    
    // Eventos de mouse para pan
    startDrag(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        
        this.offsetX += deltaX;
        this.offsetY += deltaY;
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        
        this.draw();
    }
    
    endDrag() {
        this.isDragging = false;
    }
    
    handleWheel(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        const direction = -Math.sign(e.deltaY); // rueda arriba -> acercar
        const factor = direction >= 0 ? 1.1 : 0.9; // sensibilidad
        const used = this.zoomAt(sx, sy, this.scale * factor);

        const slider = document.getElementById('zoomLevel');
        const label  = document.getElementById('zoomValue');
        slider.value = String(used);
        label.textContent = Number(used).toFixed(1);
    }
}

// Inicializar la visualización cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new RayTracerVisualization();
});
