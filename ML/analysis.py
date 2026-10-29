import os
import warnings
import numpy as np
import pickle

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE_DIR, "crop_prediction_model.pkl"), 'rb') as f:
    clf_crops = pickle.load(f)

with open(os.path.join(BASE_DIR, "disease_prediction_model.pkl"), 'rb') as f:
    clf_disease = pickle.load(f)

with open(os.path.join(BASE_DIR, "label_encoder.pkl"), 'rb') as f:
    le = pickle.load(f)

with open(os.path.join(BASE_DIR, "multi_label_binarizer.pkl"), 'rb') as f:
    mlb = pickle.load(f)


def predict_and_save_to_json(rainfall, N, P, K, pH, temperature, humidity):
    input_data = np.array([[rainfall, N, P, K, pH, temperature, humidity]])

    crops_prediction = clf_crops.predict(input_data)
    predicted_crops = mlb.inverse_transform(crops_prediction)

    disease_prediction = clf_disease.predict(input_data)
    predicted_disease = le.inverse_transform(disease_prediction)

    crop_list = [i.strip("'").strip("[").strip("]").strip("'") for i in list(predicted_crops[0])]
    predictions = {
        "predictions": {
            "crops": crop_list if predicted_crops else [],
            "diseases": list(predicted_disease)
        }
    }
    return predictions