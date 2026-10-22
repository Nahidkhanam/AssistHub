export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-4xl font-bold text-brand">Privacy</h1>
      <p>AssistHub is an independent, non-commercial project. This page explains in plain language what it stores.</p>
      <section aria-labelledby="p1"><h2 id="p1" className="text-2xl font-bold text-brand">What we store</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>If you create an account: your name, email address, a hashed password (we never store the password itself), and your text size and contrast settings.</li>
          <li>Tools you save, reviews you write and tools you suggest.</li>
          <li>Messages you send through the contact form, including your name and email.</li>
        </ul></section>
      <section aria-labelledby="p2"><h2 id="p2" className="text-2xl font-bold text-brand">What we do not do</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>We do not use advertising or tracking cookies, and we do not sell or share your data.</li>
          <li>The page checker loads the address you enter once to run its checks. It does not keep the page.</li>
        </ul></section>
      <section aria-labelledby="p3"><h2 id="p3" className="text-2xl font-bold text-brand">Your session</h2>
        <p className="mt-2">When you sign in, a sign-in token is kept in your browser so you stay signed in. Signing out removes it.</p></section>
      <section aria-labelledby="p4"><h2 id="p4" className="text-2xl font-bold text-brand">Reviews and suggestions</h2>
        <p className="mt-2">Reviews and suggestions are checked by an admin before they appear. Do not post personal information or text copied from other websites.</p></section>
      <p>To ask for your data to be deleted, use the contact form.</p>
    </div>
  );
}
