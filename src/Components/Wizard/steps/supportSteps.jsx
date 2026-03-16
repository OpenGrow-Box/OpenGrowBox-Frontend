import React from 'react'

export const createSupportStepComponents = ({ icons, helpers, styles, supportContext }) => {
  const { MdContactSupport, MdHelp, MdCheck, MdEmail } = icons
  const { getSupportRoute, getSupportCategoryLabel, buildGitHubIssueUrl, PRIVATE_SUPPORT_URL, UI_VERSION } = helpers
  const { currentRoom, userEmail, userId } = supportContext
  const {
    StepContent,
    SupportPlanNotice,
    SupportPlanBadge,
    SupportPlanText,
    SupportHelpCard,
    SupportHelpText,
    SupportHelpTitle,
    SupportHelpDescription,
    FaqButton,
    SupportSectionTitle,
    SupportSectionDescription,
    CategoryGrid,
    CategoryCard,
    CategoryIcon,
    CategoryLabel,
    CategoryDescription,
    CategoryRouteTag,
    CategoryLockTag,
    SupportHint,
    SupportFieldGroup,
    SupportFieldLabel,
    SupportInput,
    MessageTextarea,
    CharCount,
    SubmitSummary,
    SummaryRow,
    MessagePreview,
    SupportPublicNotice,
    SupportErrorText,
    SubmitButton,
  } = styles

  const SupportWelcomeStep = ({ data, updateData, nextStep, supportCategories, hasPrivateSupport, currentPlan, capitalize }) => {
    const handleQuickCategory = (category) => {
      if (category.disabled) return
      updateData({
        supportCategory: category.id,
        supportSubmitError: '',
        supportSubmitted: false,
        supportSuccessTitle: '',
        supportSuccessMessage: '',
      })
      nextStep()
    }

    return (
      <StepContent>
        <h2>Support Center</h2>
        <p>Use the FAQ for quick answers, GitHub for public product feedback, or private support for account and premium help.</p>

        <SupportPlanNotice>
          <SupportPlanBadge>{hasPrivateSupport ? capitalize(currentPlan) : 'Free'}</SupportPlanBadge>
          <SupportPlanText>
            {hasPrivateSupport
              ? 'Your plan includes private OpenGrowBox support for account, technical, and other requests. Bug reports and feature ideas still open publicly on GitHub.'
              : 'Free users can use GitHub for bugs and feature ideas. Private support starts with the Basic plan.'}
          </SupportPlanText>
        </SupportPlanNotice>

        <SupportHelpCard>
          <SupportHelpText>
            <SupportHelpTitle>Need a quick answer first?</SupportHelpTitle>
            <SupportHelpDescription>Check the OpenGrowBox FAQ before opening a request. It covers common setup, account, and device questions.</SupportHelpDescription>
          </SupportHelpText>
          <FaqButton as="a" href="https://opengrowbox.net/faq" target="_blank" rel="noreferrer"><MdHelp /><span>Browse FAQs</span></FaqButton>
        </SupportHelpCard>

        <SupportSectionTitle>Choose a route</SupportSectionTitle>
        <SupportSectionDescription>
          GitHub is public for bugs and feature ideas. Private support is for direct help and starts with the Basic plan.
        </SupportSectionDescription>

        <CategoryGrid>
          {supportCategories.map((category) => (
            <CategoryCard key={category.id} selected={data.supportCategory === category.id} disabled={category.disabled} onClick={() => handleQuickCategory(category)}>
              <CategoryIcon>{category.icon}</CategoryIcon>
              <CategoryLabel>{category.label}</CategoryLabel>
              <CategoryDescription>{category.description}</CategoryDescription>
              <CategoryRouteTag $route={category.route}>{category.route === 'github' ? 'GitHub' : 'Private Support'}</CategoryRouteTag>
              {category.disabled && <CategoryLockTag>Basic+ only</CategoryLockTag>}
            </CategoryCard>
          ))}
        </CategoryGrid>

        <SupportHint>Select the route that best matches what you want to do.</SupportHint>
      </StepContent>
    )
  }

  const SupportMessageStep = ({ data, updateData }) => {
    const supportRoute = getSupportRoute(data.supportCategory)
    const isGitHubRoute = supportRoute === 'github'
    const isFeatureRoute = data.supportCategory === 'feature'
    const stepTitle = isFeatureRoute ? 'Suggest a Feature' : 'Describe Your Issue'
    const introText = isGitHubRoute
      ? isFeatureRoute
        ? 'This creates a public GitHub feature request draft. Focus on the use case, the idea, and why it would help.'
        : 'This creates a public GitHub bug report draft. Keep it technical and avoid private account or billing information.'
      : 'This request is sent privately to OpenGrowBox support and is not publicly visible.'

    return (
      <StepContent>
        <h3>{stepTitle}</h3>
        <p>{introText}</p>
        <SupportFieldGroup>
          <SupportFieldLabel>{isFeatureRoute ? 'Feature title' : 'Short summary'}</SupportFieldLabel>
          <SupportInput
            value={data.supportSummary}
            onChange={(e) => updateData({ supportSummary: e.target.value, supportSubmitError: '' })}
            placeholder={isFeatureRoute ? 'Short public feature title' : isGitHubRoute ? 'Short public issue title' : 'Short support summary'}
          />
        </SupportFieldGroup>
        <SupportFieldGroup>
          <SupportFieldLabel>{isFeatureRoute ? 'Problem or use case' : 'Details'}</SupportFieldLabel>
          <MessageTextarea
            value={data.supportMessage}
            onChange={(e) => updateData({ supportMessage: e.target.value, supportSubmitError: '' })}
            placeholder={isFeatureRoute ? 'Describe the problem, workflow, or missing capability this feature would improve...' : 'Describe your issue in detail. Include important context and what you already tried...'}
            rows={7}
          />
          <CharCount>{data.supportMessage.length} / 2000 characters</CharCount>
        </SupportFieldGroup>

        {isGitHubRoute && !isFeatureRoute && (
          <>
            <SupportFieldGroup>
              <SupportFieldLabel>Expected behavior</SupportFieldLabel>
              <SupportInput value={data.supportExpectedBehavior} onChange={(e) => updateData({ supportExpectedBehavior: e.target.value, supportSubmitError: '' })} placeholder="What should have happened?" />
            </SupportFieldGroup>
            <SupportFieldGroup>
              <SupportFieldLabel>Actual behavior</SupportFieldLabel>
              <SupportInput value={data.supportActualBehavior} onChange={(e) => updateData({ supportActualBehavior: e.target.value, supportSubmitError: '' })} placeholder="What happened instead?" />
            </SupportFieldGroup>
            <SupportFieldGroup>
              <SupportFieldLabel>Steps to reproduce</SupportFieldLabel>
              <MessageTextarea value={data.supportReproductionSteps} onChange={(e) => updateData({ supportReproductionSteps: e.target.value, supportSubmitError: '' })} placeholder="1. Go to ...&#10;2. Click ...&#10;3. See issue ..." rows={5} />
            </SupportFieldGroup>
          </>
        )}

        {isFeatureRoute && (
          <>
            <SupportFieldGroup>
              <SupportFieldLabel>Proposed idea</SupportFieldLabel>
              <SupportInput value={data.supportExpectedBehavior} onChange={(e) => updateData({ supportExpectedBehavior: e.target.value, supportSubmitError: '' })} placeholder="What feature or change would you like to see?" />
            </SupportFieldGroup>
            <SupportFieldGroup>
              <SupportFieldLabel>Why it matters</SupportFieldLabel>
              <MessageTextarea value={data.supportActualBehavior} onChange={(e) => updateData({ supportActualBehavior: e.target.value, supportSubmitError: '' })} placeholder="Explain why this would help, what it would improve, or which users benefit from it..." rows={4} />
            </SupportFieldGroup>
          </>
        )}
      </StepContent>
    )
  }

  const SupportSubmitStep = ({ data, updateData, currentPlan }) => {
    const supportRoute = getSupportRoute(data.supportCategory)
    const isGitHubRoute = supportRoute === 'github'

    const handleSubmit = async () => {
      if (supportRoute === 'github') {
        const issueUrl = buildGitHubIssueUrl({
          categoryId: data.supportCategory,
          summary: data.supportSummary,
          message: data.supportMessage,
          currentPlan,
          expectedBehavior: data.supportExpectedBehavior,
          actualBehavior: data.supportActualBehavior,
          reproductionSteps: data.supportReproductionSteps,
          room: currentRoom,
        })
        window.open(issueUrl, '_blank', 'noopener,noreferrer')
        updateData({
          supportSubmitted: true,
          supportSubmitTarget: 'GitHub',
          supportSubmitError: '',
          supportSuccessTitle: 'GitHub issue draft opened',
          supportSuccessMessage: 'A prefilled public GitHub issue was opened in a new tab. Review it there and submit it manually.',
        })
        return
      }

      try {
        const response = await fetch(PRIVATE_SUPPORT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: data.supportCategory,
            categoryLabel: getSupportCategoryLabel(data.supportCategory),
            summary: data.supportSummary,
            message: data.supportMessage,
            expectedBehavior: data.supportExpectedBehavior,
            actualBehavior: data.supportActualBehavior,
            reproductionSteps: data.supportReproductionSteps,
            plan: currentPlan,
            room: currentRoom,
            uiVersion: UI_VERSION,
            userEmail,
            userId,
            source: 'wizard',
          }),
        })
        if (!response.ok) throw new Error(`Support service responded with ${response.status}`)
        updateData({
          supportSubmitted: true,
          supportSubmitTarget: 'Private Support',
          supportSubmitError: '',
          supportSuccessTitle: 'Support request sent',
          supportSuccessMessage: 'Your private support request was sent successfully. The OpenGrowBox team will review it shortly.',
        })
      } catch {
        updateData({
          supportSubmitError: 'Private support is not available yet. Please try again later or use the FAQ for now.',
          supportSubmitted: false,
          supportSubmitTarget: '',
        })
      }
    }

    if (data.supportSubmitted) {
      return (
        <StepContent>
          <h2>{data.supportSuccessTitle || 'Support request processed'}</h2>
          <p>{data.supportSuccessMessage}</p>
          <SubmitSummary>
            <SummaryRow><span>Category:</span><strong>{getSupportCategoryLabel(data.supportCategory)}</strong></SummaryRow>
            <SummaryRow><span>Destination:</span><strong>{data.supportSubmitTarget || (supportRoute === 'github' ? 'GitHub' : 'Private Support')}</strong></SummaryRow>
            <SummaryRow><span>Summary:</span><strong>{data.supportSummary || 'Not provided'}</strong></SummaryRow>
            <SummaryRow><span>Message:</span><MessagePreview>{data.supportMessage.substring(0, 100)}...</MessagePreview></SummaryRow>
          </SubmitSummary>
        </StepContent>
      )
    }

    return (
      <StepContent>
        <h3>Review & Submit</h3>
        <p>Review the destination and content before continuing.</p>
        <SubmitSummary>
          <SummaryRow><span>Category:</span><strong>{getSupportCategoryLabel(data.supportCategory) || 'Not selected'}</strong></SummaryRow>
          <SummaryRow><span>Destination:</span><strong>{isGitHubRoute ? 'Public GitHub Issue' : 'Private OpenGrowBox Support'}</strong></SummaryRow>
          <SummaryRow><span>Summary:</span><strong>{data.supportSummary || 'Not provided'}</strong></SummaryRow>
          <SummaryRow><span>Message:</span><MessagePreview>{data.supportMessage || 'No message provided'}</MessagePreview></SummaryRow>
        </SubmitSummary>

        {isGitHubRoute && <SupportPublicNotice>This route opens a public GitHub issue visible to others. Do not include private account or billing information.</SupportPublicNotice>}
        {data.supportSubmitError && <SupportErrorText>{data.supportSubmitError}</SupportErrorText>}
        <SubmitButton onClick={handleSubmit} disabled={!data.supportCategory || !data.supportMessage || !data.supportSummary}>
          <MdEmail /> {supportRoute === 'github' ? 'Open GitHub Issue' : 'Send Support Request'}
        </SubmitButton>
      </StepContent>
    )
  }

  return { SupportWelcomeStep, SupportMessageStep, SupportSubmitStep }
}
