# Ray Tracer Visualization

Una visualización web interactiva de trayectorias de rayos en medios aleatorios, basada en simulaciones de ray tracing en Python.

## 🌟 Características

- **Visualización interactiva** de hasta 5000 trayectorias de rayos
- **Controles dinámicos** para mostrar/ocultar diferentes elementos
- **Zoom y pan** para explorar los datos en detalle
- **Información estadística** completa de la simulación
- **Diseño responsivo** que funciona en diferentes dispositivos

## 🎯 Elementos Visualizados

- **Trayectorias de rayos**: Caminos completos de los rayos a través del medio
- **Medio aleatorio**: Partículas dispersoras con diferentes índices de refracción
- **Puntos finales**: Ubicaciones donde los rayos salen del dominio
- **Proyecciones**: Puntos finales proyectados en la circunferencia media
- **Circunferencia media**: Radio promedio de salida de los rayos

## 🚀 Uso

### Visualización Online

Visita la página web desplegada en GitHub Pages: [Ver Visualización](https://tu-usuario.github.io/ray-tracer-visualization)

### Uso Local

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/ray-tracer-visualization.git
cd ray-tracer-visualization
```

2. Sirve los archivos con un servidor web local:
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (si tienes http-server instalado)
npx http-server

# Con PHP
php -S localhost:8000
```

3. Abre tu navegador en `http://localhost:8000`

## 📊 Datos de la Simulación

Los datos provienen de una simulación de ray tracing con los siguientes parámetros:

- **500 partículas** dispersoras en el medio
- **100,000 rayos** simulados (5,000 visualizados)
- **Dominio de 20×20** unidades
- **Índices de refracción** entre 1.0 y 1.3
- **Máximo 300 rebotes** por rayo
- **Tiempo máximo** de 10 unidades

## 🎮 Controles Interactivos

### Checkboxes de Visualización
- **Mostrar Rayos**: Activa/desactiva las trayectorias de rayos
- **Mostrar Medio**: Activa/desactiva las partículas del medio
- **Puntos Finales**: Activa/desactiva los puntos de salida
- **Proyecciones**: Activa/desactiva las proyecciones en la circunferencia media
- **Circunferencia Media**: Activa/desactiva el círculo de radio promedio

### Controles de Visualización
- **Opacidad Rayos**: Ajusta la transparencia de las trayectorias (0.1 - 1.0)
- **Zoom**: Controla el nivel de zoom (0.5x - 3.0x)

### Navegación
- **Arrastrar**: Mantén presionado el botón izquierdo del mouse para mover la vista
- **Rueda del mouse**: Usa la rueda para hacer zoom in/out

## 🛠️ Estructura del Proyecto

```
ray-tracer-visualization/
├── index.html              # Página principal
├── visualization.js        # Lógica de visualización
├── ray_data.json          # Datos procesados de la simulación
├── process_data.py         # Script para procesar datos originales
└── README.md              # Este archivo
```

## 📈 Procesamiento de Datos

El script `process_data.py` convierte los datos originales de la simulación (archivos .npz) a formato JSON para la web:

```bash
python process_data.py --run-dir "ruta/a/datos/simulacion" --max-rays 5000 --output-dir .
```

### Parámetros del script:
- `--run-dir`: Directorio con los datos de la simulación
- `--max-rays`: Número máximo de rayos a procesar (default: 2000)
- `--output-dir`: Directorio de salida para el JSON (default: .)

## 🎨 Código de Colores

- **Azul claro**: Trayectorias de rayos (opacidad ajustable)
- **Azul degradado**: Partículas del medio (intensidad según índice de refracción)
- **Rojo**: Puntos finales de los rayos
- **Azul**: Proyecciones en la circunferencia media
- **Verde discontinuo**: Circunferencia de radio medio

## 🔬 Información Científica

Esta visualización muestra el comportamiento de rayos de luz propagándose a través de un medio aleatorio compuesto por partículas dispersoras. Los fenómenos observados incluyen:

- **Dispersión múltiple**: Los rayos cambian de dirección al interactuar con las partículas
- **Distribución radial**: Los puntos de salida forman un patrón circular
- **Estadísticas de transporte**: El radio medio proporciona información sobre las propiedades de transporte del medio

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Añade nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado como parte de un proyecto de investigación en ray tracing y medios aleatorios.

---

**Nota**: Esta visualización está optimizada para navegadores modernos que soporten HTML5 Canvas y ES6+.
