import pkg from 'axios';

const { head } = pkg;
export default async function isBranchURLValid(url, includeAuthorization = false) {
  try {
    const headers = includeAuthorization ? { Authorization: `token ${process.env.MILO_AEM_API_KEY}` } : {};
    const response = await head(url, { headers });
    if (response.status === 200) {
      // eslint-disable-next-line no-console
      console.info(`\nURL (${url}) returned a 200 status code. It is valid.`);
      return true;
    }
    // eslint-disable-next-line no-console
    console.info(`\nURL (${url}) returned a non-200 status code (${response.status}). It is invalid.`);
    return false;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.info(`\nError checking URL (${url}): returned a non-200 status code.`);
    return false;
  }
}
