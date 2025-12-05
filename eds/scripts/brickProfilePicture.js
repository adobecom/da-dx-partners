async function replaceBrickProfilePictures() {
  if (!window.adobeIMS?.isSignedInUser()) {
    return;
  }

  try {
    const accessToken = window.adobeIMS.getAccessToken();
    
    if (!accessToken?.token) {
      return;
    }

    const hostname = window.location.hostname;
    const isStage = !hostname.includes('partners.adobe.com');
    const env = isStage ? 'cc-collab-stage.adobe.io' : 'cc-collab.adobe.io';
    
    const headers = new Headers({ Authorization: `Bearer ${accessToken.token}` });
    const profileResponse = await fetch(`https://${env}/profile`, { headers });
    
    if (profileResponse.status !== 200) {
      return;
    }
    
    const profileData = await profileResponse.json();
    if (!profileData?.user?.avatar) {
      return;
    }

    const userAvatar = profileData.user.avatar;
    const bricks = document.querySelectorAll('.brick');

    bricks.forEach((brick) => {
      const walker = document.createTreeWalker(
        brick,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let textNode;
      while (textNode = walker.nextNode()) {
        const text = textNode.textContent.trim();
        if (text === '$profileImage') {
          const img = document.createElement('img');
          img.src = userAvatar;
          img.alt = '';
          img.dataset.userProfile = 'true';
          img.width = 96;
          img.height = 96;
          
          const picture = document.createElement('picture');
          picture.appendChild(img);
          
          const parent = textNode.parentNode;
          if (parent && parent.tagName === 'P') {
            parent.classList.add('icon-area');
          }
          
          textNode.parentNode.replaceChild(picture, textNode);
          break;
        }
      }
    });
  } catch (error) {
    console.warn('Failed to replace profile pictures in brick components:', error);
  }
}

export async function initBrickProfilePicture() {
  const checkIMS = setInterval(() => {
    if (window.adobeIMS) {
      clearInterval(checkIMS);
      
      const isSignedIn = window.adobeIMS.isSignedInUser();
      
      if (isSignedIn) {
        replaceBrickProfilePictures();
      }
      
      window.addEventListener('feds:signIn', replaceBrickProfilePictures);
    }
  }, 100);
  
  setTimeout(() => clearInterval(checkIMS), 10000);
}
