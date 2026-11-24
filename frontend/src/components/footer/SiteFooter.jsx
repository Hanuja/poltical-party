import { useEffect, useRef } from 'react'
import { ArrowRight, ArrowUpRight, MapPin, Phone, Mail, Clock, Map as MapIcon, MessageSquare } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import FooterNewsletter from './FooterNewsletter'
import { FOOTER } from './footerContent'
import { SOCIAL, SmartLink, KolamPattern, SunRays, uiStrings } from './footerParts'
import '../../styles/footer.css'

// Public-site footer. All content lives in ./footerContent.js; links with no route are skipped.

// Fade-in on view. Content is only hidden once the observer is running (.rf-reveal-on), so it stays
// visible without JS/IntersectionObserver. CSS transitions (not rAF) do the animation, so a
// throttled background tab can't leave anything stuck invisible; reduced motion = no movement.
function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || !('IntersectionObserver' in window)) return undefined
    const items = [...root.querySelectorAll('[data-rf-reveal]')]
    root.classList.add('rf-reveal-on')
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
    items.forEach((el) => io.observe(el))
    // Safety net: never leave the footer hidden.
    const t = setTimeout(() => items.forEach((el) => el.classList.add('is-in')), 4000)
    return () => { io.disconnect(); clearTimeout(t) }
  }, [rootRef])
}

function Reveal({ as: Tag = 'div', index = 0, className, style, children, ...rest }) {
  return (
    <Tag data-rf-reveal="" className={className} style={{ ...style, '--rf-i': index }} {...rest}>
      {children}
    </Tag>
  )
}

function Heading({ id, children }) {
  return <h2 id={id} className="rf-heading">{children}</h2>
}

const live = (links) => links.filter((l) => l.to)

function LinkList({ links, label, ui, className = '' }) {
  return (
    <ul className={`rf-list ${className}`}>
      {live(links).map((l) => (
        <li key={l.label}><SmartLink to={l.to} className="rf-link" newTabLabel={ui.newTab}>{label(l)}</SmartLink></li>
      ))}
    </ul>
  )
}

export default function SiteFooter() {
  const { t, language } = useLanguage()
  const ui = uiStrings(language)
  const rootRef = useRef(null)
  useReveal(rootRef)

  // English keeps the footer's own wording; Tamil/Sinhala reuse the site's existing translations.
  const label = (l) => {
    if (language === 'en' || !l.i18n) return l.label
    const tr = t(l.i18n)
    return tr && tr !== l.i18n ? tr : l.label
  }

  const { identity: id, connect: cn, cta, newsletter, bottom } = FOOTER
  const social = FOOTER.social.filter((s) => s.url && SOCIAL[s.platform])
  const contactRows = [
    cn.address && { key: 'address', Icon: MapPin, label: ui.address, value: <address className="rf-contact-value tw:whitespace-pre-line">{cn.address}</address> },
    cn.phone && { key: 'phone', Icon: Phone, label: ui.phone, value: <a className="rf-contact-value" href={`tel:${cn.phone.replace(/[^\d+]/g, '')}`}>{cn.phone}</a> },
    cn.email && { key: 'email', Icon: Mail, label: ui.mail, value: <a className="rf-contact-value" href={`mailto:${cn.email}`}>{cn.email}</a> },
    cn.hours && { key: 'hours', Icon: Clock, label: ui.hours, value: <span className="rf-contact-value tw:whitespace-pre-line">{cn.hours}</span> },
    cn.mapUrl && { key: 'map', Icon: MapIcon, label: ui.map, value: (
      <SmartLink to={cn.mapUrl} className="rf-contact-value tw:inline-flex tw:items-center tw:gap-1" newTabLabel={ui.newTab}>
        {ui.mapLink} <ArrowUpRight size={14} aria-hidden="true" />
      </SmartLink>
    ) },
    cn.contactPage?.to && { key: 'page', Icon: MessageSquare, label: ui.write, value: (
      <SmartLink to={cn.contactPage.to} className="rf-contact-value tw:inline-flex tw:items-center tw:gap-1">
        {language === 'en' ? cn.contactPage.label : label(cn.contactPage)} <ArrowRight size={14} aria-hidden="true" />
      </SmartLink>
    ) },
  ].filter(Boolean)
  const ctaButtons = live(cta.buttons)
  const legal = live(bottom.links)

  return (
    <footer className="rf-root" aria-label={ui.footer} ref={rootRef}>
      <KolamPattern />

      <div className="rf-wrap">
        {/* 01–05: five columns */}
        <div className="rf-grid">
          <Reveal as="section" aria-label={id.name} className="rf-col-identity">
            <SmartLink to="/" className="rf-logo-plate tw:shrink-0" aria-label={id.name}>
              <img src="/images/logo.png" alt="Ilankai Tamil Arasu Katchi" width="168" height="84" className="tw:h-[72px] tw:w-auto" loading="lazy" />
            </SmartLink>
            <div className="rf-identity-inner">
              <p className="party-title">Ilankai Tamil Arasu Katchi</p>
              <p className="party-subtitle">{id.motto}</p>
              <p className="party-description rf-muted tw:mt-3 tw:max-w-[52ch]">{id.vision}</p>
              {social.length > 0 && (
                <ul className="tw:mt-5 tw:flex tw:flex-wrap tw:gap-2.5" aria-label={ui.social}>
                  {social.map(({ platform, url }) => {
                    const { Icon, label: name } = SOCIAL[platform]
                    return (
                      <li key={platform}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="rf-social" aria-label={`${name} ${ui.newTab}`}>
                          <Icon />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </Reveal>

          <Reveal as="nav" index={1} aria-labelledby="rf-explore">
            <Heading id="rf-explore">{FOOTER.explore.title}</Heading>
            <LinkList links={FOOTER.explore.links} label={label} ui={ui} className="rf-list-2" />
          </Reveal>

          <Reveal as="nav" index={2} aria-labelledby="rf-identity">
            <Heading id="rf-identity">{FOOTER.ourIdentity.title}</Heading>
            <ol>
              {live(FOOTER.ourIdentity.links).map((l, i) => (
                <li key={l.label}>
                  <SmartLink to={l.to} className="rf-idlink">
                    <span className="rf-idlink-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="rf-idlink-title">{label(l)}</span>
                      {l.desc && <span className="rf-idlink-sub">{l.desc}</span>}
                    </span>
                    <ArrowRight size={16} className="rf-idlink-arrow" aria-hidden="true" />
                  </SmartLink>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal as="nav" index={3} aria-labelledby="rf-people">
            <Heading id="rf-people">{FOOTER.people.title}</Heading>
            <LinkList links={FOOTER.people.links} label={label} ui={ui} />
            <h3 className="rf-subheading">{FOOTER.resources.title}</h3>
            <LinkList links={FOOTER.resources.links} label={label} ui={ui} className="rf-list-2" />
          </Reveal>

          <Reveal as="section" index={4} aria-labelledby="rf-connect" className="rf-col-connect">
            <Heading id="rf-connect">{cn.title}</Heading>
            <ul className="rf-contact">
              {contactRows.map(({ key, Icon, label: rowLabel, value }) => (
                <li key={key}>
                  <span className="rf-contact-icon" aria-hidden="true"><Icon size={16} /></span>
                  <div className="tw:min-w-0">
                    <span className="rf-contact-label">{rowLabel}</span>
                    {value}
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* 05 continued: call to action + newsletter */}
        <div className="rf-band is-two">
          <Reveal as="section" aria-labelledby="rf-cta" className="rf-glass rf-card-pad tw:relative tw:overflow-hidden">
            <SunRays className="tw:pointer-events-none tw:absolute tw:-right-10 tw:-bottom-6 tw:w-[300px] tw:text-rf-gold tw:opacity-[0.07]" />
            <p className="tw:text-[0.72rem] tw:font-bold tw:uppercase tw:tracking-[0.16em] tw:text-rf-gold">{id.shortName}</p>
                          <h2 id="rf-cta" className="rf-cta-title tw:mt-2 tw:font-semibold">{cta.title}</h2>
            <p className="rf-muted tw:mt-3 tw:max-w-[52ch] tw:text-[0.95rem]">{cta.text}</p>
            {ctaButtons.length > 0 && (
              <div className="rf-btn-row tw:relative tw:mt-6 tw:flex tw:flex-wrap tw:gap-3">
                {ctaButtons.map((b) => (
                  <SmartLink key={b.label} to={b.to} className="rf-btn">
                    {label(b)} <ArrowRight size={16} aria-hidden="true" />
                  </SmartLink>
                ))}
              </div>
            )}
          </Reveal>
          <Reveal index={1}>
            <FooterNewsletter content={newsletter} ui={ui} language={language} />
          </Reveal>
        </div>

        {/* Bottom bar */}
        <div className="tw:pb-8">
          <div className="rf-divider rf-divider-emblem" role="presentation"><span /></div>
          <div className="rf-bottom-row">
            <div>
              <p className="tw:text-white/85">{bottom.copyright.replace('{year}', new Date().getFullYear())}</p>
              <p className="tw:mt-1 tw:font-[family-name:var(--rf-display)] tw:italic tw:text-rf-gold-soft">{bottom.credit}</p>
            </div>
            {legal.length > 0 && (
              <nav aria-label={ui.legal}>
                <ul className="rf-legal">
                  {legal.map((l) => (
                    <li key={l.label}><SmartLink to={l.to}>{label(l)}</SmartLink></li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
