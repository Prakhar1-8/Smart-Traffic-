from ultralytics import YOLO
import os

# Fix OpenMP error
os.environ['KMP_DUPLICATE_LIB_OK']='True'

def main():
    model = YOLO("yolov8n.pt")
    # run validation
    metrics = model.val(data="coco128.yaml")
    
    # print accurate results
    print("\n" + "="*50)
    print("🎯 EXACT MODEL ACCURACY RESULTS 🎯")
    print("="*50)
    print(f"Overall mAP50 (Accuracy): {metrics.box.map50 * 100:.2f}%")
    print(f"Overall mAP50-95 (Strict): {metrics.box.map * 100:.2f}%")
    
    # Get accuracy specifically for vehicles if possible
    # class 2: car, 3: motorcycle, 5: bus, 7: truck (in COCO)
    vehicle_classes = [2, 3, 5, 7]
    try:
        class_indices = metrics.ap_class_index
        car_idx = list(class_indices).index(2) if 2 in class_indices else -1
        if car_idx != -1:
            car_map50 = metrics.box.maps[car_idx] # wait, maps gives mAP50-95 usually, let's just print overall
            pass
    except Exception:
        pass
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
