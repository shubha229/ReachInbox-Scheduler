import { useEffect, useRef, useState } from "react";
import "./App.css";
type Page = "login" | "home" | "compose" | "detail";
type MailTab = "Scheduled" | "Sent";
type User = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
};
type MailStatus = "Scheduled" | "Sent" | "Failed";

type Mail = {
  id: string;
  to: string[];
  subject: string;
  body: string;
  status: MailStatus;
  scheduledAt?: string;
  sentAt?: string;
};
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
type EditorIconName =
  | "undo"
  | "redo"
  | "align"
  | "line-spacing"
  | "numbered-list"
  | "bullet-list"
  | "indent"
  | "outdent"
  | "quote"
  | "paragraph-formatting"
  | "strikethrough";

const LINE_SPACING_VALUES = [1, 1.15, 1.5, 2] as const;
const ALIGNMENT_COMMANDS = ["justifyLeft", "justifyCenter", "justifyRight", "justifyFull"] as const;
const ALIGNMENT_LABELS = ["Align left", "Align center", "Align right", "Justify"] as const;

function EditorIcon({ name }: { name: EditorIconName }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "undo":
      return (
        <svg {...common}>
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10a5 5 0 0 1 0 10h-2" />
        </svg>
      );
    case "redo":
      return (
        <svg {...common}>
          <path d="m15 4 5 5-5 5" />
          <path d="M20 9H10a5 5 0 0 0 0 10h2" />
        </svg>
      );
    case "align":
      return (
        <svg {...common}>
          <path d="M4 5h16M4 9h11M4 13h16M4 17h11" />
        </svg>
      );
    case "line-spacing":
      return (
        <svg {...common}>
          <path d="M8.5 7 12 3.5 15.5 7" />
          <path d="M8.5 17 12 20.5 15.5 17" />
        </svg>
      );
    case "numbered-list":
      return (
        <svg {...common}>
          <path d="M9 6h11M9 12h11M9 18h11" />
          <path d="M3.5 5h2v3M3.5 8h2M3.5 11h2l-2 2h2M3.5 16.5c0-1 2-1 2 0s-2 1-2 2h2" />
        </svg>
      );
    case "bullet-list":
      return (
        <svg {...common}>
          <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
          <path d="M9 6h11M9 12h11M9 18h11" />
        </svg>
      );
    case "indent":
      return (
        <svg {...common}>
          <path d="M3 8l4 4-4 4" />
          <path d="M10 4v16" />
          <path d="M14 7h6M14 12h8M14 17h6" />
        </svg>
      );

    case "outdent":
      return (
        <svg {...common}>
          <path d="M4 7h6M2 12h8M4 17h6" />
          <path d="M14 4v16" />
          <path d="M21 8l-4 4 4 4" />
        </svg>
      );
    case "quote":
      return (
        <svg {...common}>
          <path
            d="M5 6h5v5H7l-1 3H4l1-3H5V6zm10 0h5v5h-3l-1 3h-2l1-3h-1V6z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );

    case "paragraph-formatting":
      return (
        <svg {...common}>
          <path d="M5 4v16" />
          <path d="M8 5h7a3 3 0 0 1 0 6H8V5z" />
          <path d="M8 14h11M8 18h11" />
        </svg>
      );

    case "strikethrough":
      return (
        <svg {...common}>
          <path d="M16 7.5C15.5 6 14 5 12 5 9.7 5 8 6.1 8 7.8c0 1.7 1.8 2.4 4 3.2 2.5.9 4 1.6 4 3.4 0 1.8-1.7 3.1-4 3.1-2 0-3.7-.8-4.5-2.4" />
          <path d="M4 12h16" />
        </svg>
      );
  }
}

function AttachmentPreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const previewRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = previewRef.current;

    if (image) {
      image.src = url;
    }

    return () => {
      if (image) {
        image.removeAttribute("src");
      }

      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="attachment-card">
      <div className="attachment-item">
        <span aria-hidden="true">🖼️</span>

        <span className="attachment-file-name" title={file.name}>
          {file.name}
        </span>

        <button
          type="button"
          title={`Remove ${file.name}`}
          aria-label={`Remove ${file.name}`}
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      <img
        ref={previewRef}
        className="attachment-preview"
        src="data:,"
        alt={`Preview of ${file.name}`}
      />
    </div>
  );
}

function App() {
    const [page, setPage] = useState<Page>("login");
    const [user, setUser] = useState<User | null>(null);
    const [tab, setTab] = useState<MailTab>("Scheduled");
    const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
    const [query, setQuery] = useState("");
    const [showSchedule, setShowSchedule] = useState(false);
    const [recipients, setRecipients] = useState<string[]>([]);
    const [recipientInput, setRecipientInput] = useState("");
    const [sender, setSender] = useState("oliver.brown@domain.io");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [delay, setDelay] = useState("00");
    const [hourlyLimit, setHourlyLimit] = useState("00");
    const [scheduleAt, setScheduleAt] = useState("");
    const [notice, setNotice] = useState("");
    const [checkingSession, setCheckingSession] = useState(true);
    const fileInput = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const editorSelectionRef = useRef<Range | null>(null);
    const [lineSpacingIndex, setLineSpacingIndex] = useState(1);
    const [alignmentIndex, setAlignmentIndex] = useState(0);
    const [sidebarWidth, setSidebarWidth] = useState(220);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const attachmentInput = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const scheduleDateInput = useRef<HTMLInputElement>(null);

    const [emails, setEmails] = useState<Mail[]>([]);
    useEffect(() => {
      if (!user) return;

      let active = true;

      async function loadEmails() {
        try {
          const response = await fetch(
            `${API_BASE}/api/schedule?userId=${encodeURIComponent(user!.id)}`,
            {
              credentials: "include",
            }
          );

          const data: { emails?: Mail[]; error?: string } =
            await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Unable to load emails.");
          }

          if (active) {
            setEmails(data.emails ?? []);
          }
        } catch (error) {
          if (active) {
            setNotice(
              error instanceof Error
                ? error.message
                : "Unable to load saved emails."
            );
          }
        }
      }

      void loadEmails();

      return () => {
        active = false;
      };
    }, [user]);
    useEffect(() => {
        let active = true;
        async function checkSession() {
            try {
                const response = await fetch(`${API_BASE}/auth/me`, {
                    credentials: "include",
                });
                if (!response.ok)
                    return;
                const data: {
                    user?: User;
                } = await response.json();
                if (active && data.user) {
                  setUser(data.user);
                  setSender(data.user.email);
                  setPage("home");
                  setNotice("");
                }
            }
            catch {
                if (active) {
                    setNotice("Unable to connect to the authentication server.");
                }
            }
            finally {
                if (active)
                    setCheckingSession(false);
            }
        }
        void checkSession();
        return () => {
            active = false;
        };
    }, []);
    useEffect(() => {
        if (!isResizingSidebar)
            return;
        const handleMouseMove = (event: MouseEvent) => {
            setSidebarWidth(Math.min(400, Math.max(170, event.clientX)));
        };
        const handleMouseUp = () => setIsResizingSidebar(false);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizingSidebar]);
    function rememberEditorSelection() {
        const editor = editorRef.current;
        const selection = window.getSelection();
        if (!editor || !selection || selection.rangeCount === 0 || !selection.anchorNode) {
            return;
        }
        if (editor.contains(selection.anchorNode)) {
            editorSelectionRef.current = selection.getRangeAt(0).cloneRange();
        }
    }

    function runEditorCommand(command: string, value?: string) {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();
        const selection = window.getSelection();
        const savedRange = editorSelectionRef.current;
        if (selection && savedRange &&
            (savedRange.commonAncestorContainer === editor || editor.contains(savedRange.commonAncestorContainer))) {
            selection.removeAllRanges();
            selection.addRange(savedRange);
        }

        document.execCommand(command, false, value);
        setMessage(editor.innerHTML);
        rememberEditorSelection();
    }

    function cycleAlignment() {
        const nextIndex = (alignmentIndex + 1) % ALIGNMENT_COMMANDS.length;
        runEditorCommand(ALIGNMENT_COMMANDS[nextIndex]);
        setAlignmentIndex(nextIndex);
    }

    function cycleLineSpacing() {
        const nextIndex = (lineSpacingIndex + 1) % LINE_SPACING_VALUES.length;
        setLineSpacingIndex(nextIndex);
        const editor = editorRef.current;
        if (editor) editor.style.lineHeight = String(LINE_SPACING_VALUES[nextIndex]);
    }

    function htmlToPlainText(html: string): string {
        const element = document.createElement("div");
        element.innerHTML = html;
        return (element.textContent || element.innerText || "").replace(/\u00a0/g, " ").trim();
    }

    function sanitizeEditorHtml(html: string): string {
        const container = document.createElement("div");
        container.innerHTML = html;
        container.querySelectorAll("script, style, iframe, object, embed, form").forEach((node) => node.remove());
        container.querySelectorAll("*").forEach((element) => {
            Array.from(element.attributes).forEach((attribute) => {
                const name = attribute.name.toLowerCase();
                const value = attribute.value.trim().toLowerCase();
                if (name.startsWith("on") ||
                    ((name === "href" || name === "src") && value.startsWith("javascript:"))) {
                    element.removeAttribute(attribute.name);
                }
            });
        });
        return container.innerHTML;
    }

    function addRecipients(value: string) {
        const valid = value
            .split(/[,;\n\s]+/)
            .map((email) => email.trim().toLowerCase())
            .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
        setRecipients((current) => [...new Set([...current, ...valid])]);
        setRecipientInput("");
    }
    function openCompose() {
        setRecipients([]);
        setRecipientInput("");
        setSubject("");
        setMessage("");
        editorSelectionRef.current = null;
        setLineSpacingIndex(1);
        setAlignmentIndex(0);
        setScheduleAt("");
        setNotice("");
        setShowSchedule(false);
        setPage("compose");
        setAttachments([]);
    }
    async function handleFile(file?: File) {
        if (!file)
            return;
        if (!file.name.toLowerCase().endsWith(".csv") && !file.name.toLowerCase().endsWith(".txt")) {
            setNotice("Please upload a CSV or TXT file.");
            return;
        }
        try {
            const fileText = await file.text();
            addRecipients(fileText);
            setNotice("Recipient list imported. Check the recipient chips before sending.");
        }
        catch {
            setNotice("Could not read the uploaded file.");
        }
        finally {
            if (fileInput.current)
                fileInput.current.value = "";
        }
    }
    async function submitEmail() {
        const allRecipients = [...new Set([
            ...recipients,
            ...recipientInput
                .split(/[,;\n\s]+/)
                .map((email) => email.trim().toLowerCase())
                .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
        ])];

        const editorHtml = editorRef.current?.innerHTML.trim() || message.trim();
        const editorText = editorRef.current?.innerText.trim() || htmlToPlainText(message);
        const safeHtml = sanitizeEditorHtml(editorHtml);
        const formattedMessage = `<div style="line-height:${LINE_SPACING_VALUES[lineSpacingIndex]}">${safeHtml}</div>`;

        if (!allRecipients.length || !subject.trim() || !editorText) {
            setNotice("Add at least one valid recipient, a subject, and a message.");
            return;
        }

        if (scheduleAt && new Date(scheduleAt).getTime() <= Date.now()) {
            setNotice("Choose a future date and time.");
            return;
        }

        if (!user) {
            setNotice("Please sign in with Google before scheduling email.");
            setPage("login");
            return;
        }

        const start = scheduleAt ? new Date(scheduleAt) : new Date(Date.now() + 60000);

        try {
            const response = await fetch(`${API_BASE}/api/schedule`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    subject: subject.trim(),
                    body: formattedMessage,
                    recipients: allRecipients,
                    startAt: start.toISOString(),
                    delayBetweenEmailsMs: Math.max(1000, Number(delay) * 1000),
                    hourlyLimit: Math.max(1, Number(hourlyLimit)),
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || result.message || "Could not schedule the email.");
            }

            setEmails((current) => [
                ...current,
                {
                    id: result.campaignId,
                    to: allRecipients,
                    subject: subject.trim(),
                    body: formattedMessage,
                    status: "Scheduled",
                    scheduledAt: start.toLocaleString(),
                },
            ]);
            setTab("Scheduled");
            setNotice(`Campaign scheduled for ${allRecipients.length} recipient(s).`);
            setPage("home");
            setRecipients([]);
            setRecipientInput("");
            setMessage("");
            setAttachments([]);
        } catch (error) {
            setNotice(error instanceof Error ? error.message : "Unable to connect to the scheduling API.");
        }
    }

    async function logout() {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        }
        catch {
            // Clear local UI state even if the server is unreachable.
        }
        setUser(null);
        setPage("login");
        setNotice("You have been logged out.");
    }
    const visibleEmails = emails.filter((email) => {
        const matchesTab =
          tab === "Scheduled"
            ? email.status === "Scheduled"
            : email.status === "Sent" || email.status === "Failed";
        const matchesQuery = `${email.subject} ${email.to.join(" ")} ${htmlToPlainText(email.body)}`
            .toLowerCase()
            .includes(query.toLowerCase());
        return matchesTab && matchesQuery;
    });
    if (page === "login") {
        return (<main className="login-page">

        <section className="login-card">

          <h1>Login</h1>

          <button type="button" className="google-button" onClick={() => {
                window.location.href = `${API_BASE}/auth/google`;
            }}>

            <svg className="google-mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20" aria-label="Google" role="img">

              <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"/>

              <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"/>

              <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"/>

              <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"/>

            </svg> Login with Google

          </button>

          <div className="or-divider">or sign up through email</div>

          <form onSubmit={(event) => {
                event.preventDefault();
                setNotice("Email and password login is not available yet. Please use Google login.");
            }}>

            <input aria-label="Email ID" type="email" name="login-email" placeholder="Email ID" autoComplete="off"/>

            <input aria-label="Password" type="password" name="login-password" placeholder="Password" autoComplete="new-password"/>

            <button className="login-submit" type="submit">Login</button>

          </form>

          {(notice || checkingSession) && (<p className="notice">

              {checkingSession ? "Checking your login session..." : notice}

            </p>)}

        </section>

      </main>);
    }
    if (page === "compose") {
        return (<main className="compose-page">

        <header className="compose-header">

          <button className="back-button" onClick={() => setPage("home")}>←</button>

          <h1>Compose New Email</h1>

          <div className="compose-actions">
            
            <button
              type="button"
              className="icon-button attachment-trigger"
              title="Attach images"
              aria-label={`Attach images${attachments.length ? `, ${attachments.length} attached` : ""}`}
              onClick={() => attachmentInput.current?.click()}
            >
              <span className="attachment-icon-wrap">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m21.4 11.1-8.5 8.5a5 5 0 0 1-7.1-7.1l9.2-9.2a3.3 3.3 0 0 1 4.7 4.7l-9.2 9.2a1.7 1.7 0 0 1-2.4-2.4l8.5-8.5" />
                </svg>

                {attachments.length > 0 && (
                  <span className="attachment-count">
                    {attachments.length}
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              className="icon-button"
              title="Schedule date and time"
              aria-label="Schedule date and time"
              onClick={() => setShowSchedule((open) => !open)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </button>

            <button
              type="button"
              className="outline-green compose-send-button"
              onClick={() => void submitEmail()}
            >
              Send
            </button>
          </div>

        </header>

        <div className="compose-content">

          <div className="compose-row">

            <label htmlFor="sender">From</label>

            <input
              id="sender"
              type="email"
              value={user?.email ?? sender}
              readOnly
              aria-label="Sender email"
            />

          </div>

          <div className="compose-row recipient-row">

            <label htmlFor="recipient">To</label>

            <div className="recipient-area">

            <div className="chips">
              {recipients.slice(0, 3).map((email) => (
                <button
                  type="button"
                  className="recipient-chip"
                  key={email}
                  title={email}
                  onClick={() =>
                    setRecipients((current) =>
                      current.filter((item) => item !== email)
                    )
                  }
                >
                  <span className="recipient-chip-email">{email}</span>
                  <span aria-hidden="true">×</span>
                </button>
              ))}

              {recipients.length > 3 && (
                <span
                  className="recipient-overflow"
                  title={`${recipients.length - 3} additional recipients`}
                >
                  +{recipients.length - 3}
                </span>
              )}

              <input
                id="recipient"
                value={recipientInput}
                placeholder="recipient@example.com"
                onChange={(event) => setRecipientInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addRecipients(recipientInput);
                  }
                }}
                onBlur={() => {
                  if (recipientInput.trim()) {
                    addRecipients(recipientInput);
                  }
                }}
              />
            </div>

            <button
              type="button"
              className="upload-link"
              onClick={() => fileInput.current?.click()}
            >
              ↑ Upload List
            </button>

            <input ref={fileInput} className="hidden-file" type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(event) => void handleFile(event.target.files?.[0])}/>
            <input
              ref={attachmentInput}
              className="hidden-file"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              onChange={(event) => {
                const selected = Array.from(
                  event.currentTarget.files ?? []
                );
                const allowedTypes = [
                  "image/png",
                  "image/jpeg",
                  "image/gif",
                  "image/webp",
                ];

                const validImages = selected.filter(
                  (file) =>
                    allowedTypes.includes(file.type) &&
                    file.size <= 5 * 1024 * 1024
                );

                setAttachments((current) =>
                  [...current, ...validImages].slice(0, 5)
                );

                if (validImages.length !== selected.length) {
                  setNotice(
                    "Only supported images up to 5 MB each are allowed. Maximum 5 attachments."
                  );
                }

                event.currentTarget.value = "";
              }}
            />
            </div>

          </div>

          <div className="compose-row">
            <label htmlFor="subject">Subject</label>

            <input id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject"/>

          </div>

          <div className="compose-settings">

            <label>

              Delay between emails (seconds)

              <input
                type="number"
                min="0"
                step="1"
                value={delay}
                onChange={(event) => setDelay(event.target.value)}
              />

            </label>

            <label>

              Hourly Limit

              <input
                type="number"
                min="0"
                step="1"
                value={hourlyLimit}
                onChange={(event) => setHourlyLimit(event.target.value)}
              />
            </label>

          </div>

          <div className="editor">
          <div
            ref={editorRef}
            className="editor-writing-area"
            contentEditable
            role="textbox"
            aria-label="Email message"
            aria-multiline="true"
            data-placeholder="Type Your Reply..."
            suppressContentEditableWarning
            style={{
              lineHeight: LINE_SPACING_VALUES[lineSpacingIndex],
            }}
            onInput={(event) => {
              setMessage(event.currentTarget.innerHTML);
              rememberEditorSelection();
            }}
            onMouseUp={rememberEditorSelection}
            onKeyUp={rememberEditorSelection}
          />

          <div
            className="editor-toolbar"
            role="toolbar"
            aria-label="Email formatting"
          >
            <button type="button" title="Undo" aria-label="Undo" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("undo")}>
              <EditorIcon name="undo" />
            </button>
            <button type="button" title="Redo" aria-label="Redo" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("redo")}>
              <EditorIcon name="redo" />
            </button>

            <span className="editor-separator" />
            <select
              className="editor-format-select"
              aria-label="Text style"
              title="Text style"
              defaultValue="p"
              onMouseDown={() => rememberEditorSelection()}
              onChange={(event) => {
                runEditorCommand("formatBlock", event.target.value);
                event.target.value = "p";
              }}
            >
              <option value="p">Tt</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="pre">Code</option>
            </select>
            <span className="editor-separator" />
            <button type="button" title="Bold" aria-label="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("bold")}>
              <strong>B</strong>
            </button>
            <button type="button" title="Italic" aria-label="Italic" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("italic")}>
              <i>I</i>
            </button>
            <button type="button" title="Underline" aria-label="Underline" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("underline")}>
              <u>U</u>
            </button>
            <span className="editor-separator" />
            <button type="button" title={`Text alignment: ${ALIGNMENT_LABELS[alignmentIndex]}`} aria-label="Cycle text alignment" onMouseDown={(event) => event.preventDefault()} onClick={cycleAlignment}>
              <EditorIcon name="align" />
            </button>
            <button type="button" title={`Line spacing: ${LINE_SPACING_VALUES[lineSpacingIndex]}`} aria-label="Cycle line spacing" onMouseDown={(event) => event.preventDefault()} onClick={cycleLineSpacing}>
              <EditorIcon name="line-spacing" />
            </button>

            <span className="editor-separator" />
            <button type="button" title="Numbered list" aria-label="Numbered list" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("insertOrderedList")}>
              <EditorIcon name="numbered-list" />
            </button>
            <button type="button" title="Bulleted list" aria-label="Bulleted list" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("insertUnorderedList")}>
              <EditorIcon name="bullet-list" />
            </button>
            <button type="button" title="Increase indent" aria-label="Increase indent" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("indent")}>
              <EditorIcon name="indent" />
            </button>
            <button type="button" title="Decrease indent" aria-label="Decrease indent" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("outdent")}>
              <EditorIcon name="outdent" />
            </button>
            <button type="button" title="Quote" aria-label="Quote" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("formatBlock", "blockquote")}>
              <EditorIcon name="quote" />
            </button>
            <button type="button" title="Paragraph" aria-label="Normal paragraph" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("formatBlock", "p")}>
              <EditorIcon name="paragraph-formatting" />
            </button>
  
            <span className="editor-separator" />

            <button type="button" title="Strikethrough" aria-label="Strikethrough" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand("strikeThrough")}>
              <span className="strikethrough-icon">S</span>
            </button>
          </div>
          <div className="editor-flex-space" />
          </div>

          {attachments.length > 0 && (
            <div className="attachment-list compose-attachment-list">
              {attachments.map((file, index) => (
                <AttachmentPreview
                  key={`${file.name}-${file.lastModified}-${index}`}
                  file={file}
                  onRemove={() =>
                    setAttachments((current) =>
                      current.filter((_, i) => i !== index)
                    )
                  }
                />
              ))}
            </div>
          )}
          
          {showSchedule && (
            <section className="schedule-popover">
              <h3>Send Later</h3>

              <div className="schedule-date-field schedule-date-picker">
                <span className={scheduleAt ? "schedule-date-value" : "schedule-date-placeholder"}>
                  {scheduleAt
                    ? new Date(scheduleAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Pick date & time"}
                </span>

                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 10h18" />
                </svg>

                <input
                  ref={scheduleDateInput}
                  id="schedule-at"
                  className="schedule-native-input"
                  type="datetime-local"
                  aria-label="Pick date and time"
                  value={scheduleAt}
                  onChange={(event) => setScheduleAt(event.target.value)}
                />
              </div>

              <div className="schedule-presets">
                <p className="schedule-day-label">Tomorrow</p>

                {[ 
                  { label: "Tomorrow, 10:00 AM", hour: 10 },
                  { label: "Tomorrow, 11:00 AM", hour: 11 },
                  { label: "Tomorrow, 3:00 PM", hour: 15 },
                ].map((preset) => (
                  <button
                    type="button"
                    key={preset.hour}
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 1);
                      date.setHours(preset.hour, 0, 0, 0);

                      setScheduleAt(
                        new Date(
                          date.getTime() - date.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16)
                      );
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="popover-actions">
                <button
                  type="button"
                  onClick={() => setShowSchedule(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="outline-green"
                  onClick={() => {
                    if (!scheduleAt || new Date(scheduleAt).getTime() <= Date.now()) {
                      setNotice("Choose a future date and time.");
                      return;
                    }

                    setShowSchedule(false);
                    setNotice(
                      "Schedule time selected. Click Send to create the scheduled campaign."
                    );
                  }}
                >
                  Done
                </button>
              </div>
            </section>
          )}


          {notice && <p className="notice">{notice}</p>}

        </div>

      </main>);
    }
    if (page === "detail" && selectedMail) {
        return (<main className="detail-page">

        <header className="detail-header">

          <button className="back-button" onClick={() => setPage("home")}>←</button>

          <h1>{selectedMail.subject}</h1>

          <div className="detail-tools">☆ ▱ ♲</div>

        </header>

        <section className="message-detail">

          <div className="sender-avatar">{user?.name?.charAt(0).toUpperCase() || "U"}</div>

          <div className="message-content">

            <div className="sender-line"><strong>{user?.name || "ReachInbox User"}</strong><span>&lt;{user?.email || sender}&gt;</span></div>

            <p className="to-line">to {selectedMail.to.join(", ")}</p>

            <div className="message-body">{htmlToPlainText(selectedMail.body)}</div>

          </div>

        </section>

      </main>);
    }
    return (<main className="mail-app">

      <aside className="mail-sidebar" style={{ width: `${sidebarWidth}px`, flexBasis: `${sidebarWidth}px` }}>

        <button className="wordmark" onClick={() => setPage("home")}>ONB</button>

        <button className="profile-card" onClick={() => void logout()} title="Click to log out">

          <span className="profile-avatar">

            {user?.name?.charAt(0).toUpperCase() || "U"}

          </span>

          <span className="profile-info">

            <strong>{user?.name || "ReachInbox User"}</strong>

            <small>{user?.email || ""}</small>

          </span>

          <span className="profile-dropdown" aria-hidden="true">

            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">

              <path d="m6 9 6 6 6-6"/>

            </svg>

          </span>

        </button>

        <button className="compose-button" onClick={openCompose}>Compose</button>

        <p className="nav-caption">CORE</p>

        <button className={`mail-nav ${tab === "Scheduled" ? "active" : ""}`} onClick={() => setTab("Scheduled")}>

          <span>◷</span> Scheduled <small>{emails.filter((email) => email.status === "Scheduled").length}</small>

        </button>

        <button className={`mail-nav ${tab === "Sent" ? "active" : ""}`} onClick={() => setTab("Sent")}>

          <span>➤</span> Sent <small>{emails.filter((email) => email.status === "Sent").length}</small>

        </button>

      </aside>

      <div className="sidebar-resizer" onMouseDown={() => setIsResizingSidebar(true)} role="separator" aria-label="Resize sidebar" aria-orientation="vertical" title="Drag to resize sidebar"/>

      <section className="mail-main">

        <div className="mail-toolbar">

          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="⌕  Search"/>

          <button type="button" className="filter-button" title="Filter" aria-label="Filter">

            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">

              <path d="M4 5h16l-6.5 7.5v5l-3 1.5v-6.5L4 5z"/>

            </svg>

          </button>

          <button title="Refresh" aria-label="Refresh email list" onClick={() => setNotice("Email-list refresh is not connected to a backend list endpoint yet.")}>↻</button>

        </div>

        {visibleEmails.length ? (<div className="mail-list">

            {visibleEmails.map((email) => (<button className={`mail-row ${tab === "Sent" ? "sent-mail-row" : "scheduled-mail-row"}`} key={email.id} onClick={() => {
                    setSelectedMail(email);
                    setPage("detail");
                }}>

                                
                <button
                  className={`mail-row ${
                    tab === "Sent" ? "sent-mail-row" : "scheduled-mail-row"
                  }`}
                  key={email.id}
                  onClick={() => {
                    setSelectedMail(email);
                    setPage("detail");
                  }}
                >
                  <span className="mail-to">
                    To: {email.to[0]}
                  </span>

                  <span
                    className={`mail-status ${email.status.toLowerCase()}`}
                    title={email.sentAt ? `Sent` : undefined}
                  >
                    {email.status === "Scheduled"
                      ? `◷ ${email.scheduledAt || "Scheduled time not available"}`
                      : email.status === "Failed"
                        ? "Failed"
                        : "Sent"}
                  </span>

                  <span className="mail-subject">
                    <span className="mail-subject-title">
                      {email.subject || "(No subject)"}
                    </span>
                    <span className="mail-body-preview">
                      {" — "}{htmlToPlainText(email.body) || "No message content available."}
                    </span>
                  </span>

                  <span className="star" aria-hidden="true">
                    ☆
                  </span>
                </button>

                <span className={`mail-status ${email.status.toLowerCase()}`}>
                  {email.status === "Scheduled"
                    ? `◷ ${email.scheduledAt || "Scheduled time not available"}`
                    : email.status === "Failed"
                      ? "Failed"
                      : `Sent${email.sentAt ? ` · ${email.sentAt}` : ""}`}
                </span>

                <span className="mail-subject">
                  <span className="mail-subject-title">{email.subject || "(No subject)"}</span>
                  <span className="mail-body-preview"> — {htmlToPlainText(email.body) || "No message content available."}</span>
                </span>

                <span className="star" aria-hidden="true">☆</span>

              </button>))}

          </div>) : (
            <div className="mail-empty">
              <strong>
                {query.trim()
                  ? `No ${tab.toLowerCase()} emails match your search.`
                  : tab === "Sent"
                    ? "No sent emails yet"
                    : "No scheduled emails yet"}
              </strong>
              <p>
                {query.trim()
                  ? "Try a different search term."
                  : tab === "Sent"
                    ? "Emails will appear here after they have been sent."
                    : "Select Compose to schedule your first email."}
              </p>
            </div>
          )}

        {notice && <p className="notice">{notice}</p>}

      </section>

    </main>);
}
export default App;
