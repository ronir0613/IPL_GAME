/** Duplicate player slugs that represent the same person. */
export const canonicalSlugs: Record<string, string> = {
  'faf-du-plessis-vc': 'faf-du-plessis',
  'rashid-khan-vc': 'rashid-khan',
  'lokesh-rahul': 'kl-rahul',
  'muthiah-muralidaran': 'muttiah-muralitharan',
  'm-shahrukh-khan': 'shahrukh-khan',
  'dhaval-kulkarni': 'dhawal-kulkarni',
  'steven-smith': 'steve-smith',
  'sourav-ganguly-vc': 'sourav-ganguly',
  'rinku-singh-vc': 'rinku-singh',
  'venkatesh-iyer-vc': 'venkatesh-iyer',
};

export function getCanonicalSlug(slug: string): string {
  return canonicalSlugs[slug] ?? slug;
}
