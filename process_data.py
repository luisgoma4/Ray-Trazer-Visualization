#!/usr/bin/env python3
"""
Script para procesar los datos de rayos y convertirlos a formato JSON para visualización web.
"""
import json
import csv
import glob
import os
import numpy as np
import argparse

def leer_parametros(run_dir):
    """Lee los parámetros del archivo parameters.csv"""
    params_path = os.path.join(run_dir, "medium", "parameters.csv")
    params = {}
    if os.path.exists(params_path):
        with open(params_path, "r") as f:
            reader = csv.reader(f, delimiter="=")
            for row in reader:
                if len(row) == 2:
                    k, v = row[0].strip(), row[1].strip()
                    try:
                        params[k] = float(v)
                    except ValueError:
                        params[k] = v
    return params

def leer_medio(run_dir):
    """Lee los datos del medio desde medium.csv"""
    medio_path = os.path.join(run_dir, "medium", "medium.csv")
    if not os.path.exists(medio_path):
        return None
    data = np.genfromtxt(medio_path, delimiter=",", names=True)
    return data

def procesar_rayos(run_dir, max_rays=2000):
    """Procesa los archivos de rayos y extrae las trayectorias"""
    batches_dir = os.path.join(run_dir, "batches")
    if not os.path.isdir(batches_dir):
        raise ValueError(f"No existe la carpeta de lotes: {batches_dir}")
    
    files = sorted(glob.glob(os.path.join(batches_dir, "batch_*.npz")))
    rays_data = []
    endpoints = []
    rays_procesados = 0
    
    for f in files:
        if rays_procesados >= max_rays:
            break
        
        data = np.load(f)
        points = data["points"]  # (M,2)
        offsets = data["offsets"]  # (R+1,)
        R = len(offsets) - 1
        
        for k in range(R):
            if rays_procesados >= max_rays:
                break
            
            i0, i1 = int(offsets[k]), int(offsets[k+1])
            if i1 <= i0:
                continue
                
            path = points[i0:i1]
            # Convertir a lista para JSON
            ray_path = path.tolist()
            rays_data.append(ray_path)
            
            # Guardar punto final
            endpoints.append([path[-1, 0], path[-1, 1]])
            rays_procesados += 1
    
    return rays_data, endpoints

def main():
    parser = argparse.ArgumentParser(description="Procesa datos de rayos para visualización web")
    parser.add_argument("--run-dir", required=True, help="Directorio con los datos de rayos")
    parser.add_argument("--max-rays", type=int, default=2000, help="Máximo número de rayos a procesar")
    parser.add_argument("--output-dir", default=".", help="Directorio de salida para los archivos JSON")
    
    args = parser.parse_args()
    
    # Leer parámetros
    params = leer_parametros(args.run_dir)
    print(f"Parámetros leídos: {params}")
    
    # Leer medio
    medio = leer_medio(args.run_dir)
    medium_data = []
    if medio is not None:
        for x, y, n, r in zip(medio["x"], medio["y"], medio["n"], medio["radius"]):
            medium_data.append({
                "x": float(x),
                "y": float(y),
                "n": float(n),
                "radius": float(r)
            })
    
    # Procesar rayos
    print(f"Procesando rayos (máximo: {args.max_rays})...")
    rays_data, endpoints = procesar_rayos(args.run_dir, args.max_rays)
    print(f"Procesados {len(rays_data)} rayos")
    
    # Calcular estadísticas de endpoints
    if endpoints:
        ep = np.array(endpoints)
        radii = np.hypot(ep[:, 0], ep[:, 1])
        r_mean = float(np.mean(radii))
        thetas = np.arctan2(ep[:, 1], ep[:, 0])
        
        # Proyecciones en circunferencia media
        projections = []
        for theta in thetas:
            projections.append([r_mean * np.cos(theta), r_mean * np.sin(theta)])
    else:
        r_mean = 0
        projections = []
    
    # Crear estructura de datos final
    output_data = {
        "parameters": params,
        "medium": medium_data,
        "rays": rays_data,
        "endpoints": endpoints,
        "projections": projections,
        "mean_radius": r_mean,
        "stats": {
            "num_rays": len(rays_data),
            "num_medium_particles": len(medium_data)
        }
    }
    
    # Guardar como JSON
    output_file = os.path.join(args.output_dir, "ray_data.json")
    with open(output_file, "w") as f:
        json.dump(output_data, f, indent=2)
    
    print(f"Datos guardados en: {output_file}")
    print(f"Tamaño del archivo: {os.path.getsize(output_file) / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    main()



# python3 /Users/luisga/Documents/Documents/Programation/ray-tracer-visualization/process_data.py 
# --run-dir /Users/luisga/Documents/Documents/Programation/Ray\ Trazing\ in\ Random\ Medium/500_10000_10_(1.0_1.3_1.0)_42_robust 
# --max-rays 10000


# python3 "/Users/luisga/Documents/Documents/Programation/ray-tracer-visualization/process_data.py" \
#   --run-dir "/Users/luisga/Documents/Documents/Programation/Ray Trazing in Random Medium/500_10000_10_(1.0_1.3_1.0)_42_robust" \
#   --max-rays 10000 \
#   --output-dir "/Users/luisga/Documents/Documents/Programation/ray-tracer-visualization"