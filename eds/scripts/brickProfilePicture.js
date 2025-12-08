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
      const xpath = './/*[text()="$profileImage"]';
      const result = document.evaluate(xpath, brick, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const element = result.singleNodeValue;
      
      if (!element) return;

      const textNode = Array.from(element.childNodes).find(
        node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() === '$profileImage'
      );
      
      if (!textNode) return;

      const img = document.createElement('img');
      img.src = userAvatar;
      img.alt = '';
      img.dataset.userProfile = 'true';
      img.width = 96;
      img.height = 96;
      
      const picture = document.createElement('picture');
      picture.appendChild(img);
      
      if (element.tagName === 'P') {
        element.classList.add('icon-area');
      }
      
      element.replaceChild(picture, textNode);
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
