import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import pandas as pd
from PIL import Image
import os
import torchvision.transforms as transforms
from torchvision.models import resnet18

# ===== CONFIG =====
CSV_PATH = "data/Wound_dataset/labels.csv"
IMG_DIR = "data/Wound_dataset/images"

BATCH_SIZE = 2  
EPOCHS = 1
LR = 0.001

# ===== Dataset =====
class WoundDataset(Dataset):
    def __init__(self, csv_file, img_dir):
        self.data = pd.read_csv(csv_file)
        self.img_dir = img_dir
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor()
        ])

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        img_name = self.data.iloc[idx, 0]
        img_path = os.path.join(self.img_dir, img_name)

        image = Image.open(img_path).convert("RGB")
        image = self.transform(image)

        labels = torch.tensor(
            self.data.iloc[idx, 1:].values.astype("float32")
        )

        return image, labels

# ===== Load Data =====
dataset = WoundDataset(CSV_PATH, IMG_DIR)
loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

# ===== Model =====
model = resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 4)

# ===== Training =====
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=LR)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

print("🚀 Training started...")

for epoch in range(EPOCHS):
    total_loss = 0

    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)

        outputs = model(images)
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1}/{EPOCHS}, Loss: {total_loss:.4f}")

# ===== Save Model =====
os.makedirs("model", exist_ok=True)
torch.save(model.state_dict(), "model/wound_model_weights.pth")

print("✅ Model trained & saved successfully!")