/**
 * View Counter for Jekyll using Firebase Realtime Database
 * 
 * This script expects Firebase to be initialized before it loads.
 * Firebase initialization is handled in _includes/firebase-view-counter.html
 * 
 * Setup Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Enable Realtime Database in your Firebase project
 * 3. Set database rules to allow read/write (for production, restrict writes):
 *    {
 *      "rules": {
 *        "views": {
 *          ".read": true,
 *          ".write": true
 *        }
 *      }
 *    }
 * 4. Copy your Firebase config from Project Settings > General > Your apps
 * 5. Add the config to _config.yml under the "firebase:" section
 * 6. The firebase-view-counter.html include will automatically load Firebase
 */

// Use the globally initialized Firebase database
let database;
if (typeof firebase !== 'undefined' && firebase.database) {
  try {
    database = firebase.database();
  } catch (e) {
    console.warn('Firebase database not available. View counter disabled.');
  }
}

/**
 * Get the current page path for use as a unique identifier
 */
function getPagePath() {
  // Use the full pathname as the identifier
  return window.location.pathname;
}

/**
 * Increment view count for the current page
 */
function incrementViewCount() {
  if (!database) {
    return;
  }

  const pagePath = getPagePath();
  const viewsRef = database.ref('views/' + encodeURIComponent(pagePath));
  
  // Check if this is a new visitor (using sessionStorage to avoid counting same session)
  const viewKey = 'viewed_' + pagePath;
  if (sessionStorage.getItem(viewKey)) {
    return; // Already viewed in this session
  }

  // Increment view count
  viewsRef.transaction(function(currentViews) {
    return (currentViews || 0) + 1;
  }, function(error, committed, snapshot) {
    if (error) {
      console.error('Error updating view count:', error);
    } else if (committed) {
      sessionStorage.setItem(viewKey, 'true');
    }
  });
}

/**
 * Get and display view count for the current page
 */
function displayViewCount() {
  if (!database) {
    // Hide view count element if Firebase is not configured
    const viewCountElements = document.querySelectorAll('.view-count');
    viewCountElements.forEach(el => el.style.display = 'none');
    return;
  }

  const pagePath = getPagePath();
  const viewsRef = database.ref('views/' + encodeURIComponent(pagePath));
  
  viewsRef.once('value', function(snapshot) {
    const count = snapshot.val() || 0;
    const viewCountElements = document.querySelectorAll('.view-count-text');
    viewCountElements.forEach(el => {
      el.textContent = formatViewCount(count);
    });
    // Show the parent view-count element
    const viewCountContainers = document.querySelectorAll('.view-count');
    viewCountContainers.forEach(el => el.style.display = '');
  }, function(error) {
    console.error('Error reading view count:', error);
    const viewCountElements = document.querySelectorAll('.view-count');
    viewCountElements.forEach(el => el.style.display = 'none');
  });
}

/**
 * Format view count with appropriate formatting (e.g., 1.2K, 1.5M)
 */
function formatViewCount(count) {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M views';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K views';
  } else {
    return count + (count === 1 ? ' view' : ' views');
  }
}

/**
 * Display view counts for all posts on listing pages (blog/home)
 */
function displayListingViewCounts() {
  if (!database) {
    return;
  }

  const postViewElements = document.querySelectorAll('.post-view-count');
  
  postViewElements.forEach(function(element) {
    const postUrl = element.getAttribute('data-post-url');
    if (!postUrl) return;
    
    const viewsRef = database.ref('views/' + encodeURIComponent(postUrl));
    
    viewsRef.once('value', function(snapshot) {
      const count = snapshot.val() || 0;
      const viewCountText = element.querySelector('.view-count-text');
      if (viewCountText) {
        viewCountText.textContent = formatViewCount(count);
        element.style.display = '';
      }
    }, function(error) {
      console.error('Error reading view count for', postUrl, error);
      element.style.display = 'none';
    });
  });
}

// Initialize view counter when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    incrementViewCount();
    displayViewCount();
    displayListingViewCounts();
  });
} else {
  incrementViewCount();
  displayViewCount();
  displayListingViewCounts();
}

