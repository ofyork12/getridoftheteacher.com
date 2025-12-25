# How to Upload Files to GitHub

## Method 1: Using GitHub Web Interface (Easiest)

### Step 1: Go to Your Repository
1. Open your browser and go to: `https://github.com/ofyork12/getridoftheteacher.com`
2. Make sure you're on the `main` branch

### Step 2: Upload Files
1. Click the **"Add file"** button (top right, next to the green "Code" button)
2. Select **"Upload files"** from the dropdown menu

### Step 3: Select Your Files
1. You can either:
   - **Drag and drop** your files into the upload area, OR
   - Click **"choose your files"** to browse and select files
2. Upload these files:
   - `index.html`
   - `bigger-smaller.html`
   - `squares.html`

### Step 4: Commit Changes
1. Scroll down to the **"Commit changes"** section at the bottom
2. In the **"Commit message"** box, type: `Update website files`
3. Click the green **"Commit changes"** button

### Step 5: Delete Old File (if needed)
If `index-multilang.html` exists on GitHub:
1. Click on `index-multilang.html` in the file list
2. Click the **trash can icon** (Delete button) at the top right
3. Type a commit message like: `Remove redundant index-multilang.html`
4. Click **"Commit changes"**

### Step 6: Wait for GitHub Pages to Update
- GitHub Pages usually updates within 1-5 minutes
- Visit `https://getridoftheteacher.com` to see your changes

---

## Method 2: Using Git Command Line (Advanced)

If you have Git installed on your computer:

### Step 1: Open Terminal/Command Prompt
Navigate to your project folder:
```bash
cd "C:\Users\ACER\Desktop\ColorMy Webpage"
```

### Step 2: Initialize Git (if not already done)
```bash
git init
git remote add origin https://github.com/ofyork12/getridoftheteacher.com.git
```

### Step 3: Add and Commit Files
```bash
git add index.html bigger-smaller.html squares.html
git commit -m "Update website files"
```

### Step 4: Push to GitHub
```bash
git push -u origin main
```

---

## Quick Checklist:
- [ ] Upload `index.html`
- [ ] Upload `bigger-smaller.html`
- [ ] Upload `squares.html`
- [ ] Delete `index-multilang.html` (if it exists)
- [ ] Wait 1-5 minutes
- [ ] Visit `https://getridoftheteacher.com` to verify

