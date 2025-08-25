import {CAAS_TAGS_URL, getLibs} from "../../scripts/utils.js";
import {assetPreviewStyles} from "./AssetPreviewStyles.js";
import {transformCardUrl} from "../utils/utils.js";
const DEFAULT_BACKGROUND_IMAGE_PATH = '/content/dam/solution/en/images/card-collection/sample_default.png';

const miloLibs = getLibs();
const { html, LitElement, css, repeat } = await import(`${miloLibs}/deps/lit-all.min.js`);
export default class AssetPreview extends LitElement {
static styles = [
  assetPreviewStyles
    ];
constructor() {
  super();
}
  static properties = {
    blockData: { type: Object },
    title: { type: String },
    summary: { type: String },
    description: { type: String },
    fileType: { type: String },
    url: { type: String },
    thumbnailUrl: { type: String },
    tags: { type: Array },
    ctaText: { type: String },
    returnUrl: {type: String},
    createdDate: {type: Date},
    audience: {type: Array},
    types: {type: Array},
  };
  async connectedCallback() {
    super.connectedCallback();
    await this.getAssetMetadata();
  }

  async getAssetMetadata() {
    // for domain we use what is in  window.location.href (this assumes that on cards we have partners.stage.adobe.com or partners.adobe.com
    // on prod caas index we would have only have prod assets, so asset metadata  would always be found on prod
    // for stage, we will display also some assets from qa01 or dev02, but will always fetch asset metadata from stage
    // so we should delete assets from lower env if they make us problem on stage
    const mappedAssetUrl = this.getRealAssetUrl();

    await fetch(mappedAssetUrl).then(async (res) => {
      if(res.status === 200 ) {
        const assetMetadata = await res.json();
        await this.setData(assetMetadata);
      } else {
        console.log(res.status);
      }

    }).then((error) => {
       console.log('Asset doesnt exist on this instance ', error);
    })
    const testAssetmetadata = {
      "summary": "he document titled \"Desktop Deal Registration: A Step by Step Guide\" serves as a technical guide aimed at helping partners navigate the deal registration submission process through the Sales Centre/Adobe Partner Portal. It provides detailed instructions on creating and submitting new opportunities, along with key information about customer accounts and product details. The initial sections outline the steps to create a new opportunity, emphasizing adherence to Adobe's naming conventions and outlining mandatory information requirements for submission.\\n\\nSignificant dates mentioned include the preparation of the document based on FY20Q2 regional program guides, specifically noted as September 15, 2020. The guide features a detailed checklist for quick verification before deal submission, as well as a structured approach for entering customer and opportunity information, which includes notable requirements such as the industry classification and partner's sales activities. Throughout, the document emphasizes the importance of accuracy and compliance to ensure successful deal registration",
      "types": [],
      "aemPath": "/content/dam/solution/en/qatest/World Ocean Day Brochure.pdf",
      "partnerLevel": [],
      "description": "World Ocean Day Brochure",
      "title": "World Ocean Day Brochure",
      "fileType": "application/pdf",
      // "url": "https://author.local.adobe.com/digitalexperience/preview/qatest/World%20Ocean%20Day%20Brochure.pdf",
      // "url": "http://partners.stage.adobe.com/content/dam/solution/en/qatest/sample_1280x720_surfing_with_audio.mov",
      "url": "http://partners.stage.adobe.com/content/dam/solution/en/qatest/CoreGuard%20Presentation.pptx",
      "tags": [
        "caas:content-type/guide",
        "caas:products/adobe-analytics",
        "caas:adobe-partners/collections/resources",
        "caas:file-format/pdf",
        "caas:audience/customer-facing",
        "caas:audience/partners-facing",
      ],
      "size": "8353",
      "createdDate": "2025-06-24T12:04:44.129Z",

      "thumbnailUrl": "https://partners.stage.adobe.com/content/dam/solution/en/qatest/CoreGuard%20Presentation.pdf/jcr:content/renditions/cq5dam.thumbnail.319.319.png",
    };
   await this.setData(testAssetmetadata);

  }
  async setData(assetMetadata) {
    const allTags = await fetch(CAAS_TAGS_URL).then((res) => res.json());
    this.title = assetMetadata.title;
    this.summary = assetMetadata.summary;
    this.description = assetMetadata.description;
    this.fileType = assetMetadata.fileType;
    this.url = assetMetadata.url;
    this.thumbnailUrl = assetMetadata.thumbnailUrl;
    this.tags = this.getTagsDisplayValues(allTags, assetMetadata.tags);
    this.ctaText = assetMetadata.ctaText;
    this.size = this.getSizeInMb(assetMetadata.size);
    this.createdDate = assetMetadata.createdDate? new Date(assetMetadata.createdDate).toLocaleDateString('en-US') : null;
    this.audienceTags = this.getTagsFromRoot(assetMetadata.tags, allTags, 'caas:audience');
    this.fileFormatTags = this.getTagsFromRoot(assetMetadata.tags, allTags, 'caas:file-format');
  }
   getRealAssetUrl() {
    return window.location.href.replace('/digitalexperience/preview/', '/content/dam/solution/en/').concat('.assetmetadata.json');
  }
  render() {
    const isVideo = this.fileFormatTags && this.fileFormatTags[0].tagId === 'caas:file-format/video';
    return html` ${this.title 
      ? html`
        <div class="asset-preview-block-container">
        <div class="asset-preview-block-header">Asset detail: ${this.title} ${this.getFileTypeFromTag()}</div>
      <div class="asset-preview-block-details ">
        <div class="asset-preview-block-details-left">
          <p><span class="asset-preview-block-details-left-label">Date: </span>${this.createdDate}</p>
          <p><span class="asset-preview-block-details-left-label">Audience: </span>${this.getTagsTitles(this.audienceTags)}</p>
          <p><span class="asset-preview-block-details-left-label">Summary: </span>${isVideo ? this.description : this.summary || this.description}</p>
          <p><span class="asset-preview-block-details-left-label">Type: </span>${this.getTagsTitles(this.fileFormatTags)}</p>
          <p><span class="asset-preview-block-details-left-label">Tags: </span>${this.getTagsTitles(this.tags)}</p>
          <p><span class="asset-preview-block-details-left-label">Size: </span class="bold">${this.size}</p>
        </div>
        <div class="asset-preview-block-details-right"
             style="background-image:
              url(${transformCardUrl(this.thumbnailUrl)}),
               url(${transformCardUrl(DEFAULT_BACKGROUND_IMAGE_PATH)})"
        >
        </div>
      </div>
        <div class="asset-preview-block-actions">
          ${!this.isPreviewEnabled(this.getFileTypeFromTag()) ? html` <button class="outline" ><a  target="_blank" rel="noopener noreferrer" href="${this.url}">View</a></button>` : ''}
         <button class="filled""><a href="${this.url}">Download</a></button>
          <a class="link" href="${this.returnUrl}">Back to previous</a>
        </div>
        </div>
      `: 
      html`<div class="asset-preview-block-container">
        <div class="asset-preview-block-header">Asset not found</div></div>`
    }
      `;
  }
  isPreviewEnabled(fileType) {
    const enabledTypes = ['pdf', 'powerpoint'];
    return enabledTypes.includes(fileType);
  }

  getSizeInMb(size) {
    if(!size || isNaN(Number(size))) return '';
    const sizeInMb = Number(size / (1024*1024)).toFixed(2);
    const sizeInKb = Number(size / 1024).toFixed(2);
    return sizeInMb >= 1 ? `${sizeInMb} MB` : `${sizeInKb} KB` ;
  }

   getTagsDisplayValues(allTags, tags) {
    const tagsArray = [];
    tags.forEach((tag) => {
      const tagObject = this.findTagByPath( allTags.namespaces.caas.tags, tag) || {tagId: tag, title: tag};
      tagsArray.push({tagId: tag, title: tagObject.title});
    });
    return tagsArray;
  }

  findTagByPath(caasTags, tag) {
    const tagParts = tag.split('caas:')[1].split('/')
    let caasPointer = caasTags;
    tagParts.forEach((tagPart, i) => {
      if(tagParts.length-1 > i ) {
        caasPointer = caasPointer[tagPart].tags;
      } else {
        caasPointer = caasPointer[tagPart];

      }
    });
    return caasPointer || null;
  }

  getTagsFromRoot(tags, allTags, rootTag) {
    const filteredTags = tags.filter(t => t.startsWith(rootTag));
    return this.getTagsDisplayValues(allTags, filteredTags);
  }

  getFileTypeFromTag() {
    console.log(this.fileFormatTags);
    // we should always have only one file format tag since it is added based on file type
    // or we should use this.fileType but this has some ugly values (see
    // https://git.corp.adobe.com/wcms/gravity/blob/develop/app-configuration/core/src/main/java/com/adobe/wcm/configuration/utils/CaaSContentDXUtils.java#L52
    if (this.fileFormatTags && this.fileFormatTags.length)
    return `(${this.fileFormatTags[0].title})`;
    else return '';
  }

  getTagsTitles(tags) {
    return tags?.map((tag,i) => `${tag.title}${this.tags.length-1 > i ? ', ': ''}`);
  }
}
