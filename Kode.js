// noinspection JSUnusedGlobalSymbols

const ss = SpreadsheetApp.openById('1NsRr3ehNnP0i1eZgRmP9lYKZW5x6xzIQLknJsC6abzQ');

const scrapeProject = () => {
  const sheetName = 'projects.co.id';
  Logger.log(`Start scraping ${sheetName} ..`);
  const html = UrlFetchApp.fetch('https://projects.co.id/public/browse_projects/listing').getContentText();
  Logger.log(`Parsing data from html ..`)
  const projects = html.split('\n')
      .filter(i => i.startsWith('<h2>'))
      .map(i => {
      i = i.replace('<h2><a href="', '');
      i = i.replace('">', '|');
      i = i.replace('</a></h2><p>', '|');
      i = i.replace('</p>', '|');
      const [url, title, desc] = i.split('|');
      return {
        url,
        title: title.trim(),
        desc: desc.trim()
      };
    })
  Logger.log(`Filtering projects from web ..`);
  const filteredProjects = checkExistingProjects(projects, sheetName);
  if (!filteredProjects.length) return Logger.log(`Done scraping ${sheetName} ..`);
  Logger.log(`Save projects to database ..`);
  saveProjects(filteredProjects, sheetName);
  Logger.log(`Send notify new project to WhatsApp ..`);
  whatsAppNotify(filteredProjects);
  Logger.log(`Send notify new project to Email ..`);
  emailNotify(filteredProjects);
  Logger.log(`Done scraping ${sheetName} ..`);
  return projects;
}

const checkExistingProjects = (projects, sheetName) => {
  const sheet = ss.getSheetByName(sheetName);
  const existingProjectsUrl = sheet.getRange(1, 1, sheet.getLastRow())
      .getValues()
      .map(arr => arr[0]);
  return projects.filter(i => !existingProjectsUrl.includes(i.url));
}

const saveProjects = (projects, sheetName) => {
  const sheet = ss.getSheetByName(sheetName);
  const [headers] = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
  sheet.getRange(sheet.getLastRow() + 1, 1, projects.length, sheet.getLastColumn())
      .setValues(projects.map(obj => headers.map((v) => obj[v])));
}

const whatsAppNotify = (projects) => {
  Logger.log(`${projects.length} messages queued ..`);
  projects.map((project, i) => {
    const content = `*${project.title}*\n${project.desc}\n${project.url}`;
    UrlFetchApp.fetch('https://kirimwa.semutim.com/send?to=6285155099696&content=' + encodeURIComponent(content));
    Logger.log(`${i + 1} messages sent ..`);
  });
}

const emailNotify = (projects) => {
  Logger.log(`${projects.length} message queued ..`);
  projects.map((project, i) => {
    const subject = project.title;
    const content = `${project.desc}\n${project.url}`;
    if (MailApp.getRemainingDailyQuota()) MailApp.sendEmail('hakiramadhani@gmail.com', subject, content);
    Logger.log(`${i + 1} messages sent ..`);
  });
}

/*
  Function for start the service running by cronjob
 */
const start = () => {
  scrapeProject();
}

/*
  Function for test the service running manual
 */
const test = () => {
  // just test comment
}