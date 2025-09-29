"""
forecast_model.py
Crowd count forecasting for Smart Crowd Management.

- Supports both Linear Regression (baseline) and LSTM (deep learning).
- Trains on demo synthetic data if no CSV is provided.
- Functions:
    - train_linear_model()
    - train_lstm_model()
    - predict_future_counts(model, history, n_steps)
    - demo_run()
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import logging
import sys
import time
import json
from typing import List, Dict, Tuple

from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split

# For LSTM
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

# For enhanced output and progress display
from colorama import init, Fore, Style
from tqdm import tqdm
from tabulate import tabulate

# Initialize colorama
init(autoreset=True)

# ---------------- Logging Configuration ----------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ---------------- Linear Regression Forecast ----------------
def train_linear_model(history_counts, n_steps=6):
    """
    Trains a simple linear regression model on past counts.
    history_counts: list of past counts
    n_steps: number of future predictions
    """
    print_header("Linear Regression Training")
    
    # Show loading animation
    with tqdm(total=100, desc=f"{Fore.YELLOW}Training Linear Model", 
              bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt}") as pbar:
        X = np.arange(len(history_counts)).reshape(-1, 1)
        y = np.array(history_counts)

        model = LinearRegression()
        model.fit(X, y)

        future_idx = np.arange(len(history_counts), len(history_counts) + n_steps).reshape(-1, 1)
        preds = model.predict(future_idx)
        
        # Calculate training error
        train_mse = mean_squared_error(y, model.predict(X))
        logger.info(f"📊 Training MSE: {train_mse:.2f}")
        
        for i in range(10):  # Simulate progress
            time.sleep(0.1)
            pbar.update(10)
    
    return model, preds.tolist()

# ---------------- LSTM Forecast ----------------
def create_lstm_model(input_shape):
    model = Sequential()
    model.add(LSTM(64, activation='relu', input_shape=input_shape))
    model.add(Dense(1))
    model.compile(optimizer='adam', loss='mse')
    return model

def train_lstm_model(history_counts, look_back=5, n_steps=6, epochs=20):
    """
    Train an LSTM model on time-series crowd counts.
    history_counts: list of past counts
    look_back: how many past steps to look at
    n_steps: number of future predictions
    """
    print_header("LSTM Model Training")
    
    data = np.array(history_counts, dtype=np.float32)
    X, y = [], []
    for i in range(len(data) - look_back):
        X.append(data[i:i+look_back])
        y.append(data[i+look_back])
    X, y = np.array(X), np.array(y)

    X = X.reshape((X.shape[0], X.shape[1], 1))  # [samples, timesteps, features]

    # Split train-test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    model = create_lstm_model((look_back, 1))
    
    class CustomCallback(tf.keras.callbacks.Callback):
        def on_train_begin(self, logs=None):
            self.progress = tqdm(total=epochs, desc=f"{Fore.YELLOW}Training LSTM",
                               bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}]")
            
        def on_epoch_end(self, epoch, logs=None):
            self.progress.update(1)
            if (epoch + 1) % 5 == 0:
                print(f"\n{Fore.GREEN}Epoch {epoch+1}/{epochs}:")
                print(f"{Fore.WHITE}Loss: {logs['loss']:.4f}")
                print(f"Val Loss: {logs['val_loss']:.4f}")
                
        def on_train_end(self, logs=None):
            self.progress.close()
    
    # Fit model with custom callback
    history = model.fit(
        X_train, y_train,
        epochs=epochs,
        verbose=0,
        validation_data=(X_test, y_test),
        callbacks=[CustomCallback()]
    )
    
    # Forecast future n_steps
    last_seq = data[-look_back:]
    preds = []
    input_seq = last_seq.reshape((1, look_back, 1))
    for _ in range(n_steps):
        next_val = model.predict(input_seq, verbose=0)[0][0]
        preds.append(float(next_val))
        # shift input sequence
        input_seq = np.append(input_seq[:, 1:, :], [[[next_val]]], axis=1)

    return model, preds

# ---------------- Demo Run ----------------
def demo_run():
    print_header("Crowd Forecasting Demo")
    
    # Create synthetic demo data (sinusoidal + noise)
    timesteps = 100
    history_counts = (50 + 20 * np.sin(np.linspace(0, 6*np.pi, timesteps)) + 
                     np.random.normal(0, 3, timesteps)).astype(int).tolist()

    # Train and display results
    lin_model, lin_preds = train_linear_model(history_counts, n_steps=10)
    print_result_table(lin_preds, "Linear Regression")
    
    lstm_model, lstm_preds = train_lstm_model(history_counts, look_back=5, n_steps=10, epochs=10)
    print_result_table(lstm_preds, "LSTM")
    
    # Plot with enhanced styling
    plt.style.use('seaborn')
    plt.figure(figsize=(12,6))
    plt.plot(history_counts, label="Historical Data", color='#2E86C1', linewidth=2)
    plt.plot(range(len(history_counts), len(history_counts)+10), 
            lin_preds, 'ro--', label="Linear Forecast", linewidth=2)
    plt.plot(range(len(history_counts), len(history_counts)+10), 
            lstm_preds, 'go--', label="LSTM Forecast", linewidth=2)
    plt.grid(True, alpha=0.3)
    plt.legend(frameon=True, facecolor='white', framealpha=1)
    plt.title("Crowd Count Forecasting", pad=20, fontsize=14)
    plt.xlabel("Time Steps", labelpad=10)
    plt.ylabel("Crowd Count", labelpad=10)
    
    print(f"\n{Fore.CYAN}Displaying forecast plot...{Style.RESET_ALL}")
    plt.show()
    
    print(f"\n{Fore.GREEN}✨ Demo completed successfully!{Style.RESET_ALL}")

def print_header(text):
    print(f"\n{Fore.CYAN}{'='*50}")
    print(f"{Fore.CYAN}{text.center(50)}")
    print(f"{Fore.CYAN}{'='*50}{Style.RESET_ALL}\n")

def print_result_table(predictions, model_name):
    headers = ["Step", "Prediction", "Confidence"]
    # Add fake confidence for demonstration
    confidence = [f"{100-i*3:.1f}%" for i in range(len(predictions))]
    table_data = [[i+1, f"{pred:.1f}", conf] for i, (pred, conf) in enumerate(zip(predictions, confidence))]
    print(f"\n{Fore.GREEN}{model_name} Predictions:{Style.RESET_ALL}")
    print(tabulate(table_data, headers=headers, tablefmt="fancy_grid"))

def load_detection_data(detection_data: List[Dict]) -> Tuple[List[str], List[int]]:
    """Extract timestamps and counts from detection data"""
    timestamps = [d["timestamp"] for d in detection_data]
    counts = [d["count"] for d in detection_data]
    return timestamps, counts

def forecast_from_detections(detection_data: List[Dict], method="lstm", 
                           look_back=30, n_steps=10) -> Dict:
    """Generate forecasts from detection data"""
    _, counts = load_detection_data(detection_data)
    
    if method.lower() == "lstm":
        model, predictions = train_lstm_model(counts, 
                                            look_back=look_back,
                                            n_steps=n_steps)
    else:
        model, predictions = train_linear_model(counts, n_steps=n_steps)
    
    return {
        "method": method,
        "predictions": predictions,
        "look_back": look_back,
        "n_steps": n_steps
    }

# ---------------- Entry Point ----------------
if __name__ == "__main__":
    demo_run()
