// Dynamic Homepage Router for Freshmart Organic Food
import { db, doc, onSnapshot } from "./firebase-config.js";

// Check active homepage configuration from Firestore
const currentPath = window.location.pathname.split('/').pop() || 'index.html';

// Do not run router inside Admin Panel
if (!currentPath.includes('admin')) {
  try {
    const themeDocRef = doc(db, 'settings', 'homepage');
    onSnapshot(themeDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const activePage = docSnap.data().activeHomepage || 'index.html';
        
        // Normalize homepage filename comparison
        let normalizedCurrent = currentPath === '' ? 'index.html' : currentPath;
        if (normalizedCurrent === '/') normalizedCurrent = 'index.html';

        if (activePage !== normalizedCurrent) {
          // Prevent infinite redirect loops if target is current page
          const targetUrl = activePage;
          if (window.location.pathname.endsWith(targetUrl) === false) {
            window.location.href = targetUrl;
          }
        }
      }
    });
  } catch (err) {
    console.log("Homepage router notice:", err);
  }
}
