import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import example1 from "../assets/example3.jpg";
import example2 from "../assets/example1.jpg";
import example3 from "../assets/example2.jpg";
import heroBanner from "../assets/hero-banner.jpg";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      {/* ---------- Hero ---------- */}
      <section
        className="hero"
        style={{ backgroundImage: `url(${heroBanner})` }}
      >
        <h1>Civic Issue Tracker</h1>
        <p className="hero-subtitle">
          A citizen-first platform to report civic issues directly to your local
          government because a cleaner, safer India starts with every one of us
          speaking up.
        </p>
        <div className="hero-actions">
          <Link to={user ? "/report" : "/register"} className="cta-btn primary">
            Report an Issue
          </Link>
          {!user && (
            <Link to="/login" className="cta-btn secondary">
              Already registered? Login
            </Link>
          )}
        </div>
      </section>

      {/* ---------- Why it matters ---------- */}
      <section className="content-section">
        <h2>Why Reporting Civic Issues Matters in a Democracy</h2>
        <p>
          In a democracy, governance is not something that happens <em>to</em>{" "}
          citizens, it happens <em>with</em> them. Every pothole left unfixed,
          every streetlight left dark, every pile of uncollected garbage is a
          small failure of the feedback loop between people and the institutions
          meant to serve them. That feedback loop only works if citizens have an
          easy, transparent, and accountable way to raise their voice.
        </p>
        <p>
          When you report a civic issue, you are not just filing a complaint,
          you are participating in governance. You are generating the data that
          local authorities need to prioritize repairs, allocate budgets, and
          measure their own performance. A single report might seem small, but
          thousands of reports build a real, evidence-based picture of where a
          city or town is failing its people and where it's improving.
        </p>
        <p>
          Countries with strong civic reporting culture consistently see faster
          infrastructure response times, better public accountability, and
          higher trust between citizens and government. This platform exists to
          make that culture easier to build here.
        </p>
      </section>

      {/* ---------- Swachh Bharat / cleanliness ---------- */}
      <section className="content-section highlight">
        <h2>Towards a Cleaner, Flawless India</h2>
        <p>
          The vision of a clean India is not the responsibility of sanitation
          workers or municipal corporations alone, it is a shared civic duty.
          Garbage dumps, clogged drains, broken roads, and neglected public
          spaces don't just look bad, they affect public health, safety, and the
          everyday dignity of every citizen who has to walk past them.
        </p>
        <p>
          This platform is built in the spirit of the{" "}
          <strong>Swachh Bharat Mission</strong>, the idea that a cleaner, more
          well-maintained India is achievable when citizens and government work
          as partners rather than as separate parties. Every issue you report
          and every issue that gets resolved is a small, measurable step toward
          that goal.
        </p>
      </section>

      {/* ---------- Safety of reporting ---------- */}
      <section className="content-section">
        <h2>Is It Safe to Report an Issue? Yes, Here's How</h2>
        <p>
          A common hesitation citizens have is:{" "}
          <em>"Will reporting an issue cause problems for me?"</em> The answer
          is no, and this platform is designed specifically to make reporting
          safe, simple, and free of consequence for the person raising the
          issue.
        </p>
        <ul className="safety-list">
          <li>
            <strong>No public exposure of personal details.</strong> Your name
            is never shown to the public alongside your report only authorized
            staff handling the issue can see who submitted it, purely to follow
            up if more information is needed.
          </li>
          <li>
            <strong>You are reporting infrastructure, not people.</strong> This
            platform is built for civic infrastructure issues potholes, garbage,
            broken lights not disputes with individuals. There is no
            confrontation involved in filing a report.
          </li>
          <li>
            <strong>Full transparency on status.</strong> Every report has a
            visible, auditable status history Reported → Acknowledged → In
            Progress → Resolved, so you always know what's happening with your
            submission and nothing happens silently or behind closed doors.
          </li>
          <li>
            <strong>Reporting is a protected civic right.</strong> Constructive
            civic participation, including reporting infrastructure problems to
            local authorities, is a normal and protected part of democratic life
            not something that invites retaliation.
          </li>
        </ul>
      </section>

      {/* ---------- What to report — image examples ---------- */}
      <section className="content-section">
        <h2>What Should You Report?</h2>
        <p>
          Not sure if something is "report-worthy"? If it affects safety,
          cleanliness, or public infrastructure, it belongs here. A few common
          examples:
        </p>
        <div className="example-grid">
          <div className="example-card">
            <img
              src={example1}
              alt="Potholes & Damaged Roads"
              className="example-image"
            />
            <h4>🕳️ Potholes & Damaged Roads</h4>
            <p>
              Cracked pavements, deep potholes, or crumbling roads that pose a
              risk to vehicles and pedestrians.
            </p>
          </div>
          <div className="example-card">
            <img
              src={example2}
              alt="Uncollected Garbage"
              className="example-image"
            />
            <h4>🗑️ Uncollected Garbage</h4>
            <p>
              Overflowing bins, illegal dumping, or garbage left uncollected for
              extended periods.
            </p>
          </div>
          <div className="example-card">
            <img
              src={example3}
              alt="Broken Streetlights"
              className="example-image"
            />
            <h4>💡 Broken Streetlights</h4>
            <p>
              Non-functional or damaged streetlights that create safety hazards
              after dark.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="site-footer">
        <p className="swachh-bharat">
          🧹 In support of the Swachh Bharat Mission, A Cleaner India, Together.
        </p>
        <p className="copyright">
          © {new Date().getFullYear()} Civic Issue Tracker. Made by Jewel
          Hossain.
        </p>
      </footer>
    </div>
  );
}
