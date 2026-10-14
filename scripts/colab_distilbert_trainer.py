"""
Google Colab Training Script for Deceptive Opinion Spam / Yelp Reviews
Uses PyTorch and Hugging Face Transformers (DistilBERT)
"""

import os
import torch
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from transformers import (
    DistilBertTokenizerFast,
    DistilBertForSequenceClassification,
    Trainer,
    TrainingArguments
)

# 1. Check GPU
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using compute device: {device}")

# 2. Load dataset
# In Colab: upload deceptive_opinion_sample.csv or full Ott corpus
dataset_url = "https://raw.githubusercontent.com/atpaino/deep-thinking/master/data/deceptive-opinion.csv"
try:
    df = pd.read_csv(dataset_url)
    print(f"Loaded {len(df)} reviews from remote repository")
except Exception:
    df = pd.read_csv("deceptive_opinion_sample.csv")
    print(f"Loaded {len(df)} reviews locally")

# Standardize text and labels (1 for deceptive, 0 for truthful)
text_col = "text" if "text" in df.columns else df.columns[0]
label_col = "deceptive" if "deceptive" in df.columns else ("label" if "label" in df.columns else df.columns[1])

texts = df[text_col].astype(str).tolist()
labels = [1 if str(l).strip().lower() in ["deceptive", "1", "fake"] else 0 for l in df[label_col]]

train_texts, val_texts, train_labels, val_labels = train_test_split(
    texts, labels, test_size=0.2, random_state=42
)

# 3. Tokenization using DistilBertTokenizerFast
tokenizer = DistilBertTokenizerFast.from_pretrained('distilbert-base-uncased')
train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=256)
val_encodings = tokenizer(val_texts, truncation=True, padding=True, max_length=256)

class ReviewDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)

train_dataset = ReviewDataset(train_encodings, train_labels)
val_dataset = ReviewDataset(val_encodings, val_labels)

# 4. Model setup
model = DistilBertForSequenceClassification.from_pretrained('distilbert-base-uncased', num_labels=2)
model.to(device)

def compute_metrics(pred):
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)
    precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average='binary')
    acc = accuracy_score(labels, preds)
    return {
        'accuracy': acc,
        'f1': f1,
        'precision': precision,
        'recall': recall
    }

# 5. Training Arguments
training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    warmup_steps=100,
    weight_decay=0.01,
    logging_dir='./logs',
    logging_steps=10,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="f1"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    compute_metrics=compute_metrics
)

# 6. Train and Save
print("Starting training on Google Colab...")
trainer.train()

# 7. Save model and tokenizer for deployment
os.makedirs("./saved_distilbert_model", exist_ok=True)
model.save_pretrained("./saved_distilbert_model")
tokenizer.save_pretrained("./saved_distilbert_model")
print("Model saved to ./saved_distilbert_model ready for download & backend deployment!")

