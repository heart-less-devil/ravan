const fs = require('fs');
const path = require('path');

// Backup data files
const backupData = () => {
  const dataDir = path.join(__dirname, 'data');
  const backupDir = path.join(__dirname, 'backups', new Date().toISOString().split('T')[0]);
  
  // Create backup directory
  if (!fs.existsSync(path.join(__dirname, 'backups'))) {
    fs.mkdirSync(path.join(__dirname, 'backups'), { recursive: true });
  }
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const files = [
    'biotechData.json',
    'users.json', 
    'verificationCodes.json',
    'uploadedFiles.json'
  ];

  files.forEach(file => {
    const sourcePath = path.join(dataDir, file);
    const backupPath = path.join(backupDir, file);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, backupPath);
      console.log(`Backed up ${file}`);
    }
  });

  console.log(`Backup completed: ${backupDir}`);
};

// Run backup
backupData(); 