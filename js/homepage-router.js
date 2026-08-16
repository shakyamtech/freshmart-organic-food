// Dynamic Homepage, Product Page, Product Detail & Blog Router for Freshmart Organic Food
import { db, doc, onSnapshot } from "./firebase-config.js";

function normalizePageName(str) {
  if (!str) return 'index';
  let clean = str.split('/').pop().split('?')[0].replace(/\.html$/, '').replace(/^\//, '').trim();
  return (clean === '' || clean === 'index') ? 'index' : clean;
}

const currentNormalized = normalizePageName(window.location.pathname);

// Do not run router inside Admin Panel
if (!currentNormalized.includes('admin')) {

  // 1. DYNAMIC HOMEPAGE ROUTING
  const isHomepage = ['index', 'home-2', 'home-3', 'home-4', 'home-5'].includes(currentNormalized);

  if (isHomepage) {
    const themeDocRef = doc(db, 'settings', 'homepage');
    onSnapshot(themeDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const activePageRaw = docSnap.data().activeHomepage || 'index.html';
        const activeNormalized = normalizePageName(activePageRaw);

        if (activeNormalized !== currentNormalized) {
          const targetUrl = activeNormalized === 'index' ? 'index.html' : `${activeNormalized}.html`;
          // Use replace() so back button doesn't loop
          window.location.replace(targetUrl);
        }
      }
    }, (error) => {
      console.warn('Homepage router: Could not read homepage setting -', error.message);
    });
  }

  // 2. DYNAMIC PRODUCT LISTING PAGE LINK UPDATER
  const productDocRef = doc(db, 'settings', 'product_layout');
  onSnapshot(productDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const activeProductPage = docSnap.data().activeProductLayout || 'product-grid-left-sidebar.html';
      const productLinks = document.querySelectorAll('a[title="Product"], a.dynamic-product-link');
      productLinks.forEach(link => { link.href = activeProductPage; });
    }
  }, (error) => {
    console.warn('Homepage router: Could not read product layout -', error.message);
  });

  // 3. DYNAMIC PRODUCT DETAIL PAGE LINK UPDATER
  const detailDocRef = doc(db, 'settings', 'product_detail_layout');
  onSnapshot(detailDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const activeDetailPage = docSnap.data().activeDetailLayout || 'product-detail-left-sidebar.html';
      const detailLinks = document.querySelectorAll('a[href*="product-detail"], a.dynamic-detail-link');
      detailLinks.forEach(link => { link.href = activeDetailPage; });
    }
  }, (error) => {
    console.warn('Homepage router: Could not read detail layout -', error.message);
  });

  // 4. DYNAMIC BLOG PAGE LINK UPDATER
  const blogDocRef = doc(db, 'settings', 'blog_layout');
  onSnapshot(blogDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const activeBlogPage = docSnap.data().activeBlogLayout || 'blog-list-left-sidebar-1.html';
      const blogLinks = document.querySelectorAll('a[title="Blog"], a.dynamic-blog-link');
      blogLinks.forEach(link => { link.href = activeBlogPage; });
    }
  }, (error) => {
    console.warn('Homepage router: Could not read blog layout -', error.message);
  });

}
