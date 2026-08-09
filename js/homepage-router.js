// Dynamic Homepage & Product Page Router for Freshmart Organic Food
import { db, doc, onSnapshot } from "./firebase-config.js";

const currentPath = window.location.pathname.split('/').pop() || 'index.html';

// Do not run router inside Admin Panel
if (!currentPath.includes('admin')) {
  try {
    // 1. DYNAMIC HOMEPAGE ROUTING
    const isHomepage = ['index.html', 'home-2.html', 'home-3.html', 'home-4.html', 'home-5.html', ''].includes(currentPath);
    
    if (isHomepage) {
      const themeDocRef = doc(db, 'settings', 'homepage');
      onSnapshot(themeDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const activePage = docSnap.data().activeHomepage || 'index.html';
          let normalizedCurrent = (currentPath === '' || currentPath === '/') ? 'index.html' : currentPath;

          if (activePage !== normalizedCurrent) {
            if (window.location.pathname.endsWith(activePage) === false) {
              window.location.href = activePage;
            }
          }
        }
      });
    }

    // 2. DYNAMIC PRODUCT PAGE LINK UPDATER
    const productDocRef = doc(db, 'settings', 'product_layout');
    onSnapshot(productDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const activeProductPage = docSnap.data().activeProductLayout || 'product-grid-left-sidebar.html';
        
        // Update all Product nav links on current page
        const productLinks = document.querySelectorAll('a[title="Product"], a.dynamic-product-link');
        productLinks.forEach(link => {
          link.href = activeProductPage;
        });
      }
    });

  } catch (err) {
    console.log("Router notice:", err);
  }
}
