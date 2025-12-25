# GitHub Pages Upload Guide

## Files to Upload to Root Directory:
1. `index.html` - Main page (must be in root for GitHub Pages)
2. `bigger-smaller.html` - Game page
3. `squares.html` - Squares game page
4. `index-multilang.html` - Multilanguage version (optional)

## Important Notes:
- **index.html MUST be a file, not a directory**
- All HTML files should be in the root directory (not in subfolders)
- Delete any directories named `index`, `bigger-smaller`, or `squares` if they exist
- After uploading, GitHub Pages will serve `index.html` when someone visits your domain

## How to Fix:
1. Go to your GitHub repository
2. Delete the directories: `index`, `bigger-smaller`, `squares` (if they exist)
3. Click "Add file" → "Upload files"
4. Upload these files to the root:
   - index.html
   - bigger-smaller.html
   - squares.html
   - index-multilang.html (optional)
5. Commit the changes
6. Wait a few minutes for GitHub Pages to update

## Verify:
After uploading, your repository root should show:
- CNAME (file)
- README.md (file)
- index.html (file) ← This is critical!
- bigger-smaller.html (file)
- squares.html (file)
- index-multilang.html (file)

