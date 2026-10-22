export const platforms = ['Windows', 'Mac', 'Linux', 'Android', 'iPhone and iPad'];
export const needs = ['Read the screen aloud', 'Describe my surroundings', 'Get live help'];

export const nvdaPanels = [
  { id: 'what', title: 'What is NVDA?', body: ['NonVisual Desktop Access (NVDA) is a free, open-source screen reader for Windows. It gives feedback through synthetic speech and braille, so people who are blind or have low vision can use a Windows computer at no extra cost.', 'It is developed by NV Access with contributions from the community.'] },
  { id: 'features', title: 'Key features', list: ['Works with popular programs, including web browsers, email clients, chat programs and office suites', 'Built-in speech with support for many languages, and a user interface translated into dozens of languages', 'Supports many refreshable braille displays, with automatic detection for many of them', 'Can run from a USB drive without installation (portable mode)', 'A talking installer that makes setup easier', 'Reads text under the mouse and can play sounds to show where the mouse is', 'Reports formatting such as font, size and spelling errors where available'] },
  { id: 'start', title: 'How to get started', list: ['Download NVDA only from the official NV Access website.', 'Run the talking installer, or choose the portable option to run it from a USB drive.', 'Start NVDA and listen to the welcome dialog.', 'Open your web browser and press Tab to move through links and buttons.', 'Use the shortcut table on the Learn page to move by headings, links and landmarks.'] },
];

export const audiences = [
  { title: 'People who are blind', text: 'Screen readers turn text on the screen into speech or braille, so a website only works if it is built with real headings, labels and links.' },
  { title: 'People with low vision', text: 'Large text, strong contrast and clear focus outlines matter most. AssistHub lets you change text size and switch to a high-contrast theme at any time.' },
  { title: 'People who find reading hard', text: 'Listening to a page read aloud, with a speed you choose, can make long text easier to follow. Every AssistHub page has a Read aloud button.' },
];

export const faqs = [
  { q: 'Is AssistHub an official site for these tools?', a: 'No. AssistHub is an independent project. Tool names belong to their owners, and every description is written in our own words with a link to the official site.' },
  { q: 'Are all of these tools really free?', a: 'Each card shows the cost. Some are free and open source, and some are built in to your device. Prices and features can change, so check the official site before you rely on one.' },
  { q: 'Which screen reader should I start with?', a: 'Use the one that already comes with your device: Narrator on Windows, VoiceOver on Apple devices, or TalkBack on Android. On Windows, NVDA is a popular free choice if you want more features.' },
  { q: 'How do I suggest a tool?', a: 'Use the form on the Contact us page and include the tool name and its official website.' },
];

export const shortcuts = [
  { keys: 'Insert or CapsLock', does: 'The NVDA key. Hold it with another key for NVDA commands (default desktop layout)' },
  { keys: 'Ctrl', does: 'Stop speech' },
  { keys: 'NVDA + Down arrow', does: 'Read from the current position (say all)' },
  { keys: 'NVDA + T', does: 'Read the title of the current window' },
  { keys: 'NVDA + F7', does: 'Open a list of links, headings and landmarks on the page' },
  { keys: 'Tab and Shift + Tab', does: 'Move to the next or previous link, button or field' },
  { keys: 'H and Shift + H', does: 'Next or previous heading (web pages)' },
  { keys: 'K', does: 'Next link (web pages)' },
  { keys: 'B', does: 'Next button (web pages)' },
  { keys: 'F', does: 'Next form field (web pages)' },
  { keys: 'D', does: 'Next landmark such as main or navigation (web pages)' },
  { keys: 'NVDA + Q', does: 'Quit NVDA' },
];

export const checks = [
  { title: 'Use only the keyboard', text: 'Press Tab through the whole page. You should always see where focus is, reach every control, and close dialogs with Esc.' },
  { title: 'Run Lighthouse', text: 'In Chrome, open DevTools, choose Lighthouse and tick Accessibility. Fix every item it reports.' },
  { title: 'Run axe or WAVE', text: 'Both are free browser extensions that list the exact elements that fail WCAG checks.' },
  { title: 'Try a screen reader', text: 'Turn on Narrator, VoiceOver or TalkBack and listen to the page. Headings, buttons and form fields should each be announced with a clear name.' },
  { title: 'Zoom to 200 and 400 percent', text: 'Nothing should be cut off, and you should not need to scroll sideways to read a line of text.' },
];

export const contactInfo = { note: 'AssistHub is an independent, non-commercial project. Messages go to the site administrator and are not shared.' };
