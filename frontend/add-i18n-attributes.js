/**
 * Script to automatically add data-i18n attributes to index.html
 * Run this in browser console on index.html page
 */

function addI18nAttributes() {
    console.log('Adding i18n attributes to index.html...');
    
    // Why Choose Us section
    const whyTitle = document.querySelector('.why-choose-us h2');
    if (whyTitle && !whyTitle.hasAttribute('data-i18n')) {
        whyTitle.setAttribute('data-i18n', 'landing.whyChooseTitle');
    }
    
    const whyDesc = document.querySelector('.why-choose-us .why-description');
    if (whyDesc && !whyDesc.hasAttribute('data-i18n')) {
        whyDesc.setAttribute('data-i18n', 'landing.whyChooseDesc');
    }
    
    // Feature items in Why Choose Us
    const features = document.querySelectorAll('.why-choose-us .feature-item');
    const featureKeys = [
        ['landing.endToEndEncryption', 'landing.endToEndEncryptionDesc'],
        ['landing.completePrivacy', 'landing.completePrivacyDesc'],
        ['landing.hipaaCompliant', 'landing.hipaaCompliantDesc'],
        ['landing.cloudBased', 'landing.cloudBasedDesc']
    ];
    
    features.forEach((feature, index) => {
        const h4 = feature.querySelector('h4');
        const p = feature.querySelector('p');
        if (h4 && featureKeys[index]) {
            h4.setAttribute('data-i18n', featureKeys[index][0]);
        }
        if (p && featureKeys[index]) {
            p.setAttribute('data-i18n', featureKeys[index][1]);
        }
    });
    
    // Reviews section
    const reviewsTitle = document.querySelector('.reviews-section h2');
    if (reviewsTitle && !reviewsTitle.hasAttribute('data-i18n')) {
        reviewsTitle.setAttribute('data-i18n', 'landing.reviewsTitle');
    }
    
    const reviewsDesc = document.querySelector('.reviews-section .section-header p');
    if (reviewsDesc && !reviewsDesc.hasAttribute('data-i18n')) {
        reviewsDesc.setAttribute('data-i18n', 'landing.reviewsDesc');
    }
    
    // Contact section
    const contactTitle = document.querySelector('.contact-section h2');
    if (contactTitle && !contactTitle.hasAttribute('data-i18n')) {
        contactTitle.setAttribute('data-i18n', 'landing.contactTitle');
    }
    
    const contactDesc = document.querySelector('.contact-info > p');
    if (contactDesc && !contactDesc.hasAttribute('data-i18n')) {
        contactDesc.setAttribute('data-i18n', 'landing.contactDesc');
    }
    
    // CTA section
    const ctaTitle = document.querySelector('.cta-section h2');
    if (ctaTitle && !ctaTitle.hasAttribute('data-i18n')) {
        ctaTitle.setAttribute('data-i18n', 'landing.ctaTitle');
    }
    
    const ctaDesc = document.querySelector('.cta-section p');
    if (ctaDesc && !ctaDesc.hasAttribute('data-i18n')) {
        ctaDesc.setAttribute('data-i18n', 'landing.ctaDesc');
    }
    
    // Footer
    const footerDesc = document.querySelector('footer .footer-section p');
    if (footerDesc && !footerDesc.hasAttribute('data-i18n')) {
        footerDesc.setAttribute('data-i18n', 'landing.footerDesc');
    }
    
    // Retranslate page
    if (typeof I18n !== 'undefined') {
        I18n.translatePage();
        console.log('✓ i18n attributes added and page retranslated!');
    } else {
        console.log('✓ i18n attributes added! Refresh page to see translations.');
    }
}

// Run automatically
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addI18nAttributes);
} else {
    addI18nAttributes();
}
