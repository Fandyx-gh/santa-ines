import { describe, expect, it } from 'vitest';
import { initialAnswers, santaInesConfig } from '../config/santaInes';
import { validateStep } from './validation';

function completeApartmentAnswers() {
  return {
    ...initialAnswers,
    totalApartments: 5,
    apartmentDistribution: { oneBedroom: 2, twoBedrooms: 2, threeBedrooms: 1 },
    apartmentsSimilar: 'yes',
    apartmentOccupancy: { oneBedroom: 2, twoBedrooms: 4, threeBedrooms: 6 },
  };
}

describe('discovery step validation', () => {
  it('requires every visible apartment question', () => {
    const result = validateStep(0, initialAnswers, santaInesConfig);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.name)).toEqual([
      'totalApartments',
      'apartmentDistribution.oneBedroom',
      'apartmentsSimilar',
      'apartmentOccupancy.oneBedroom',
    ]);
  });

  it('requires the distribution to match the total number of apartments', () => {
    const answers = completeApartmentAnswers();
    answers.apartmentDistribution = { oneBedroom: 2, twoBedrooms: 0, threeBedrooms: 0 };

    expect(validateStep(0, answers, santaInesConfig).errors.map((error) => error.name)).toContain('apartmentDistribution.oneBedroom');

    answers.apartmentDistribution = { oneBedroom: 2, twoBedrooms: 2, threeBedrooms: 1 };
    expect(validateStep(0, answers, santaInesConfig).valid).toBe(true);
  });

  it('only requires occupancy for apartment types present in the distribution', () => {
    const answers = {
      ...initialAnswers,
      totalApartments: 1,
      apartmentDistribution: { oneBedroom: 1, twoBedrooms: 0, threeBedrooms: 0 },
      apartmentsSimilar: 'yes',
      apartmentOccupancy: { oneBedroom: 1, twoBedrooms: null, threeBedrooms: null },
    };

    expect(validateStep(0, answers, santaInesConfig).valid).toBe(true);
  });

  it('does not require hidden conditional fields', () => {
    const answers = completeApartmentAnswers();
    expect(validateStep(0, answers, santaInesConfig).valid).toBe(true);

    answers.apartmentsSimilar = 'no';
    expect(validateStep(0, answers, santaInesConfig).valid).toBe(false);
    answers.apartmentDifferences = 'Distribuciones diferentes';
    expect(validateStep(0, answers, santaInesConfig).valid).toBe(true);
  });

  it('requires the custom value while Otro is selected and clears that requirement when deselected', () => {
    const answers = {
      ...initialAnswers,
      services: ['other'],
       apartmentPhotos: ['none'],
    };

    expect(validateStep(1, answers, santaInesConfig).errors.map((error) => error.name)).toContain('servicesOther');
    answers.servicesOther = 'Terraza';
    expect(validateStep(1, answers, santaInesConfig).valid).toBe(true);
    answers.services = ['wifi'];
    answers.servicesOther = '';
    expect(validateStep(1, answers, santaInesConfig).valid).toBe(true);
  });

  it('requires the external platform question and its custom platform when applicable', () => {
    const platformQuestion = santaInesConfig.sections[5].questions.find((question) => question.id === 'externalPlatforms');
    expect(platformQuestion?.options?.map((option) => option.label)).toEqual(expect.arrayContaining(['Booking.com', 'Airbnb', 'Expedia', 'Despegar', 'Otra', 'No por ahora', 'No estamos seguros']));

    const answers = {
      ...initialAnswers,
      desiredCapabilities: ['availability'],
      externalPlatforms: ['other'],
      domainPreference: ['santaines-co'],
      personalReview: 'yes',
      requestChannels: ['whatsapp'],
    };

    expect(validateStep(5, answers, santaInesConfig).errors.map((error) => error.name)).toContain('externalPlatformsOther');
    answers.externalPlatformsOther = 'Vrbo';
    expect(validateStep(5, answers, santaInesConfig).valid).toBe(true);
  });

  it('requires the domain choice and its conditional details', () => {
    const domainQuestion = santaInesConfig.sections[5].questions.find((question) => question.id === 'domainPreference');
    expect(domainQuestion?.options?.map((option) => option.label)).toEqual(expect.arrayContaining([
      'santaines.com',
      'santaines.co',
      'santaines.com.co',
      'amobladossantaines.com',
      'apartahotelsantaines.com',
      'Ya tenemos un dominio',
      'Otra opción',
      'No estamos seguros todavía',
    ]));

    const answers = {
      ...initialAnswers,
      desiredCapabilities: ['availability'],
      externalPlatforms: ['not-now'],
      domainPreference: ['other'],
      personalReview: 'yes',
      requestChannels: ['whatsapp'],
    };

    expect(validateStep(5, answers, santaInesConfig).errors.map((error) => error.name)).toContain('domainOther');
    answers.domainOther = 'santainesalojamiento.co';
    expect(validateStep(5, answers, santaInesConfig).valid).toBe(true);

    answers.domainPreference = ['existing'];
    answers.domainOther = '';
    expect(validateStep(5, answers, santaInesConfig).errors.map((error) => error.name)).toContain('existingDomain');
    answers.existingDomain = 'santaines.com.co';
    expect(validateStep(5, answers, santaInesConfig).valid).toBe(true);
  });

  it('requires a valid email when email is selected as a request channel', () => {
    const answers = {
      ...initialAnswers,
      desiredCapabilities: ['availability'],
      externalPlatforms: ['not-now'],
      domainPreference: ['santaines-com'],
      personalReview: 'yes',
      requestChannels: ['email'],
      requestEmail: 'correo-invalido',
    };

    expect(validateStep(5, answers, santaInesConfig).errors.map((error) => error.name)).toContain('requestEmail');
    answers.requestEmail = 'reservas@santaines.com';
    expect(validateStep(5, answers, santaInesConfig).valid).toBe(true);
  });

  it('requires reservation conditions and their custom value when applicable', () => {
    const answers = {
      ...initialAnswers,
      availabilityTracking: ['calendar'],
      confirmedReservationTracking: ['calendar'],
      bookingInformation: 'Nombres y fechas',
      reservationConditions: ['other'],
       afterHours: ['whatsapp'],
       reservationAuthority: ['administration'],
    };

    expect(validateStep(4, answers, santaInesConfig).errors.map((error) => error.name)).toContain('reservationConditionsOther');
    answers.reservationConditionsOther = 'No se permiten mascotas';
    expect(validateStep(4, answers, santaInesConfig).valid).toBe(true);
  });

  it('requires the final additional-notes response', () => {
    const answers = {
      ...initialAnswers,
      deposit: 'no',
      paymentMethods: ['cash'],
      digitalImprovements: ['unsure'],
    };

    expect(validateStep(6, answers, santaInesConfig).errors.map((error) => error.name)).toContain('finalAdditionalNotes');
    answers.finalAdditionalNotes = 'No';
    expect(validateStep(6, answers, santaInesConfig).valid).toBe(true);
  });
});
