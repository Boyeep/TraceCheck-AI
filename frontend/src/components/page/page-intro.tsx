import { TypedText } from "../typed-text";

type PageIntroProps = {
  title: string;
  description: string;
  sectionClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

const joinClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

export const PageIntro = ({
  title,
  description,
  sectionClassName,
  titleClassName,
  descriptionClassName,
}: PageIntroProps) => (
  <section
    className={joinClasses("route-section", "page-hero-plain", sectionClassName)}
  >
    <h1 className={joinClasses("route-title", titleClassName)}>{title}</h1>
    <TypedText
      as="p"
      className={joinClasses("lede", descriptionClassName)}
      cursor
      startDelay={180}
      text={description}
      typingSpeed={12}
    />
  </section>
);
