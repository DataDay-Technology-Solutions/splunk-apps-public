/**
 * Splunk Innovators Toolkit - Exercises Page Handler
 * Handles all 10 hands-on exercises
 */

require([
    'jquery',
    'underscore',
    'app/splunk-innovators-toolkit/components/sit-modal',
    'app/splunk-innovators-toolkit/components/sit-toast'
], function($, _, SITModal, SITToast) {
    'use strict';

    // Only run on exercises page
    if (window.location.href.indexOf('hands_on_exercises') === -1) {
        return;
    }

    console.log('SIT Exercises: Initializing...');

    // SITToast is an object with methods, not a constructor
    var toast = SITToast;
    var completed = {
        ex1: false, ex2: false, ex3: false, ex4: false, ex5: false,
        ex6: false, ex7: false, ex8: false, ex9: false, ex10: false
    };

    var hints = {
        ex1: {
            count: 0,
            steps: [
                "toast.success('Great job!');",
                "toast.success('Great job!', {\n  title: 'Well Done!'\n});",
                "toast.success('You completed your first exercise!', {\n  title: 'Well Done!'\n});"
            ]
        },
        ex2: {
            count: 0,
            steps: [
                "var modal = new SITModal({\n  title: 'Welcome!'\n});",
                "var modal = new SITModal({\n  title: 'Welcome!',\n  content: '<p>This is my first modal.</p>'\n});",
                "var modal = new SITModal({\n  title: 'Welcome!',\n  content: '<p>This is my first modal.</p>'\n});\nmodal.show();"
            ]
        },
        ex3: {
            count: 0,
            steps: [
                "SITModal.confirm(\n  'Do you like this toolkit?',\n  'Feedback',\n  function() {\n    // On confirm\n  },\n  function() {\n    // On cancel\n  }\n);",
                "SITModal.confirm(\n  'Do you like this toolkit?',\n  'Feedback',\n  function() {\n    toast.success('Thanks!');\n  },\n  function() {\n    // On cancel\n  }\n);",
                "SITModal.confirm(\n  'Do you like this toolkit?',\n  'Feedback',\n  function() {\n    toast.success('We appreciate it!', { title: 'Thanks!' });\n  },\n  function() {\n    toast.info('Thanks for trying!', { title: 'No problem!' });\n  }\n);"
            ]
        },
        ex4: {
            count: 0,
            steps: [
                "toast.error('Unable to connect');",
                "toast.error('Unable to reach the server.', {\n  title: 'Error'\n});",
                "toast.error('Unable to reach the server. Please try again.', {\n  title: 'Connection Failed'\n});"
            ]
        },
        ex5: {
            count: 0,
            steps: [
                "toast.warning('Session expiring soon');",
                "toast.warning('Your session will expire.', {\n  title: 'Warning'\n});",
                "toast.warning('Your session will expire in 5 minutes.', {\n  title: 'Session Expiring'\n});"
            ]
        },
        ex6: {
            count: 0,
            steps: [
                "var modal = new SITModal({\n  title: 'Save Changes?',\n  content: '<p>Do you want to save?</p>',\n  buttons: []\n});\nmodal.show();",
                "var modal = new SITModal({\n  title: 'Save Changes?',\n  content: '<p>Do you want to save?</p>',\n  buttons: [\n    { label: 'Cancel', type: 'secondary', action: 'close' }\n  ]\n});\nmodal.show();",
                "var modal = new SITModal({\n  title: 'Save Changes?',\n  content: '<p>Do you want to save your changes?</p>',\n  buttons: [\n    { label: 'Cancel', type: 'secondary', action: 'close' },\n    { label: 'Save', type: 'primary', action: 'close' }\n  ]\n});\nmodal.show();"
            ]
        },
        ex7: {
            count: 0,
            steps: [
                "toast.info('Helpful tip');",
                "toast.info('You can press Ctrl+S to save.', {\n  title: 'Tip'\n});",
                "toast.info('You can press Ctrl+S to save at any time.', {\n  title: 'Did You Know?'\n});"
            ]
        },
        ex8: {
            count: 0,
            steps: [
                "SITModal.alert('Report generated!');",
                "SITModal.alert('Your report has been generated!', 'Done');",
                "SITModal.alert('Your report has been generated!', 'Success');"
            ]
        },
        ex9: {
            count: 0,
            steps: [
                "toast.info('Step 1 complete');\ntoast.info('Step 2 complete');",
                "toast.info('Step 1 complete');\ntoast.info('Step 2 complete');\ntoast.success('Done!');",
                "toast.info('Step 1 complete');\ntoast.info('Step 2 complete');\ntoast.success('All done!');"
            ]
        },
        ex10: {
            count: 0,
            steps: [
                "var modal = new SITModal({\n  title: 'Feature List',\n  size: 'lg',\n  content: '<p>Features:</p>'\n});\nmodal.show();",
                "var modal = new SITModal({\n  title: 'Feature List',\n  size: 'lg',\n  content: '<ul><li>Feature 1</li><li>Feature 2</li></ul>'\n});\nmodal.show();",
                "var modal = new SITModal({\n  title: 'Feature List',\n  size: 'lg',\n  content: '<ul style=\"padding-left: 20px;\"><li>Beautiful modals and dialogs</li><li>Toast notifications</li><li>Interactive form controls</li></ul>'\n});\nmodal.show();"
            ]
        }
    };

    var defaults = {
        ex1: "toast.success('message');",
        ex2: "var modal = new SITModal({\n  title: 'Title'\n});\nmodal.show();",
        ex3: "SITModal.confirm(\n  'question',\n  'Title',\n  function() {\n    // On confirm\n  },\n  function() {\n    // On cancel\n  }\n);",
        ex4: "toast.error('message');",
        ex5: "toast.warning('message');",
        ex6: "var modal = new SITModal({\n  title: 'Title',\n  content: '<p>Content</p>',\n  buttons: [\n    // Add buttons here\n  ]\n});\nmodal.show();",
        ex7: "toast.info('message');",
        ex8: "SITModal.alert('message', 'title');",
        ex9: "// Show multiple toasts\ntoast.info('First message');",
        ex10: "var modal = new SITModal({\n  title: 'Title',\n  size: 'md',\n  content: '<p>Content here</p>'\n});\nmodal.show();"
    };

    function updateProgress() {
        for (var i = 1; i <= 10; i++) {
            if (completed['ex' + i]) {
                $('#badge-' + i).addClass('complete').html('&#10003;');
            }
        }

        var allComplete = true;
        for (var j = 1; j <= 10; j++) {
            if (!completed['ex' + j]) {
                allComplete = false;
                break;
            }
        }

        if (allComplete) {
            $('#progress-tracker').hide();
            $('#all-complete').addClass('show');
        }
    }

    function executeCode(code) {
        try {
            var fn = new Function('toast', 'SITModal', '_', '$', code);
            fn(toast, SITModal, _, $);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // Generic handler factory for simple toast exercises
    function createToastHandlers(exNum, toastType) {
        $(document).on('click', '#ex' + exNum + '-hint', function() {
            var h = hints['ex' + exNum];
            h.count = Math.min(h.count + 1, 2);
            $('#ex' + exNum + '-hint-count').text(h.count + '/2');
            $('#ex' + exNum + '-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex' + exNum + '-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex' + exNum + '-reset', function() {
            $('#ex' + exNum + '-code').val(defaults['ex' + exNum]);
            $('#ex' + exNum + '-output').removeClass('show');
            $('#ex' + exNum + '-error').removeClass('show');
            hints['ex' + exNum].count = 0;
            $('#ex' + exNum + '-hint-count').text('0/2');
            completed['ex' + exNum] = false;
            $('#badge-' + exNum).removeClass('complete').html(exNum);
        });

        $(document).on('click', '#ex' + exNum + '-run', function() {
            var code = $('#ex' + exNum + '-code').val();
            $('#ex' + exNum + '-error').removeClass('show');
            $('#ex' + exNum + '-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex' + exNum + '-error-text').text(result.error);
                $('#ex' + exNum + '-error').addClass('show');
                return;
            }

            if (code.indexOf('toast.' + toastType) !== -1) {
                completed['ex' + exNum] = true;
                $('#ex' + exNum + '-output').addClass('show');
                updateProgress();
            }
        });
    }

    // Generic handler factory for modal exercises
    function createModalHandlers(exNum, checkFn) {
        $(document).on('click', '#ex' + exNum + '-hint', function() {
            var h = hints['ex' + exNum];
            h.count = Math.min(h.count + 1, 2);
            $('#ex' + exNum + '-hint-count').text(h.count + '/2');
            $('#ex' + exNum + '-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex' + exNum + '-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex' + exNum + '-reset', function() {
            $('#ex' + exNum + '-code').val(defaults['ex' + exNum]);
            $('#ex' + exNum + '-output').removeClass('show');
            $('#ex' + exNum + '-error').removeClass('show');
            hints['ex' + exNum].count = 0;
            $('#ex' + exNum + '-hint-count').text('0/2');
            completed['ex' + exNum] = false;
            $('#badge-' + exNum).removeClass('complete').html(exNum);
        });

        $(document).on('click', '#ex' + exNum + '-run', function() {
            var code = $('#ex' + exNum + '-code').val();
            $('#ex' + exNum + '-error').removeClass('show');
            $('#ex' + exNum + '-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex' + exNum + '-error-text').text(result.error);
                $('#ex' + exNum + '-error').addClass('show');
                return;
            }

            setTimeout(function() {
                if (checkFn(code)) {
                    completed['ex' + exNum] = true;
                    $('#ex' + exNum + '-output').addClass('show');
                    updateProgress();
                }
            }, 200);
        });
    }

    // Wait for DOM to be ready
    $(document).ready(function() {
        console.log('SIT Exercises: DOM ready, attaching handlers...');

        // Exercise 1: Success Toast
        $(document).on('click', '#ex1-hint', function() {
            var h = hints.ex1;
            h.count = Math.min(h.count + 1, 2);
            $('#ex1-hint-count').text(h.count + '/2');
            $('#ex1-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex1-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex1-reset', function() {
            $('#ex1-code').val(defaults.ex1);
            $('#ex1-output').removeClass('show');
            $('#ex1-error').removeClass('show');
            hints.ex1.count = 0;
            $('#ex1-hint-count').text('0/2');
            completed.ex1 = false;
            $('#badge-1').removeClass('complete').html('1');
        });

        $(document).on('click', '#ex1-run', function() {
            var code = $('#ex1-code').val();
            $('#ex1-error').removeClass('show');
            $('#ex1-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex1-error-text').text(result.error);
                $('#ex1-error').addClass('show');
                return;
            }

            if (code.indexOf("toast.success") !== -1) {
                completed.ex1 = true;
                $('#ex1-output').addClass('show');
                updateProgress();
            }
        });

        // Exercise 2: Open Modal
        $(document).on('click', '#ex2-hint', function() {
            var h = hints.ex2;
            h.count = Math.min(h.count + 1, 2);
            $('#ex2-hint-count').text(h.count + '/2');
            $('#ex2-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex2-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex2-reset', function() {
            $('#ex2-code').val(defaults.ex2);
            $('#ex2-output').removeClass('show');
            $('#ex2-error').removeClass('show');
            hints.ex2.count = 0;
            $('#ex2-hint-count').text('0/2');
            completed.ex2 = false;
            $('#badge-2').removeClass('complete').html('2');
        });

        $(document).on('click', '#ex2-run', function() {
            var code = $('#ex2-code').val();
            $('#ex2-error').removeClass('show');
            $('#ex2-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex2-error-text').text(result.error);
                $('#ex2-error').addClass('show');
                return;
            }

            setTimeout(function() {
                if ($('.sit-modal-backdrop').length > 0) {
                    completed.ex2 = true;
                    $('#ex2-output').addClass('show');
                    updateProgress();
                }
            }, 200);
        });

        // Exercise 3: Confirm Dialog
        $(document).on('click', '#ex3-hint', function() {
            var h = hints.ex3;
            h.count = Math.min(h.count + 1, 2);
            $('#ex3-hint-count').text(h.count + '/2');
            $('#ex3-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex3-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex3-reset', function() {
            $('#ex3-code').val(defaults.ex3);
            $('#ex3-output').removeClass('show');
            $('#ex3-error').removeClass('show');
            hints.ex3.count = 0;
            $('#ex3-hint-count').text('0/2');
            completed.ex3 = false;
            $('#badge-3').removeClass('complete').html('3');
        });

        $(document).on('click', '#ex3-run', function() {
            var code = $('#ex3-code').val();
            $('#ex3-error').removeClass('show');
            $('#ex3-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex3-error-text').text(result.error);
                $('#ex3-error').addClass('show');
                return;
            }

            if (code.indexOf('SITModal.confirm') !== -1 && (code.indexOf('toast.success') !== -1 || code.indexOf('toast.info') !== -1)) {
                var checkComplete = setInterval(function() {
                    if ($('.sit-modal-backdrop').length === 0) {
                        clearInterval(checkComplete);
                        completed.ex3 = true;
                        $('#ex3-output').addClass('show');
                        updateProgress();
                    }
                }, 300);
                setTimeout(function() { clearInterval(checkComplete); }, 30000);
            }
        });

        // Exercise 4: Error Toast
        $(document).on('click', '#ex4-hint', function() {
            var h = hints.ex4;
            h.count = Math.min(h.count + 1, 2);
            $('#ex4-hint-count').text(h.count + '/2');
            $('#ex4-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex4-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex4-reset', function() {
            $('#ex4-code').val(defaults.ex4);
            $('#ex4-output').removeClass('show');
            $('#ex4-error').removeClass('show');
            hints.ex4.count = 0;
            $('#ex4-hint-count').text('0/2');
            completed.ex4 = false;
            $('#badge-4').removeClass('complete').html('4');
        });

        $(document).on('click', '#ex4-run', function() {
            var code = $('#ex4-code').val();
            $('#ex4-error').removeClass('show');
            $('#ex4-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex4-error-text').text(result.error);
                $('#ex4-error').addClass('show');
                return;
            }

            if (code.indexOf('toast.error') !== -1) {
                completed.ex4 = true;
                $('#ex4-output').addClass('show');
                updateProgress();
            }
        });

        // Exercise 5: Warning Toast
        $(document).on('click', '#ex5-hint', function() {
            var h = hints.ex5;
            h.count = Math.min(h.count + 1, 2);
            $('#ex5-hint-count').text(h.count + '/2');
            $('#ex5-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex5-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex5-reset', function() {
            $('#ex5-code').val(defaults.ex5);
            $('#ex5-output').removeClass('show');
            $('#ex5-error').removeClass('show');
            hints.ex5.count = 0;
            $('#ex5-hint-count').text('0/2');
            completed.ex5 = false;
            $('#badge-5').removeClass('complete').html('5');
        });

        $(document).on('click', '#ex5-run', function() {
            var code = $('#ex5-code').val();
            $('#ex5-error').removeClass('show');
            $('#ex5-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex5-error-text').text(result.error);
                $('#ex5-error').addClass('show');
                return;
            }

            if (code.indexOf('toast.warning') !== -1) {
                completed.ex5 = true;
                $('#ex5-output').addClass('show');
                updateProgress();
            }
        });

        // Exercise 6: Modal with Custom Buttons
        $(document).on('click', '#ex6-hint', function() {
            var h = hints.ex6;
            h.count = Math.min(h.count + 1, 2);
            $('#ex6-hint-count').text(h.count + '/2');
            $('#ex6-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex6-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex6-reset', function() {
            $('#ex6-code').val(defaults.ex6);
            $('#ex6-output').removeClass('show');
            $('#ex6-error').removeClass('show');
            hints.ex6.count = 0;
            $('#ex6-hint-count').text('0/2');
            completed.ex6 = false;
            $('#badge-6').removeClass('complete').html('6');
        });

        $(document).on('click', '#ex6-run', function() {
            var code = $('#ex6-code').val();
            $('#ex6-error').removeClass('show');
            $('#ex6-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex6-error-text').text(result.error);
                $('#ex6-error').addClass('show');
                return;
            }

            setTimeout(function() {
                if ($('.sit-modal-backdrop').length > 0 && code.indexOf('buttons') !== -1) {
                    completed.ex6 = true;
                    $('#ex6-output').addClass('show');
                    updateProgress();
                }
            }, 200);
        });

        // Exercise 7: Info Toast
        $(document).on('click', '#ex7-hint', function() {
            var h = hints.ex7;
            h.count = Math.min(h.count + 1, 2);
            $('#ex7-hint-count').text(h.count + '/2');
            $('#ex7-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex7-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex7-reset', function() {
            $('#ex7-code').val(defaults.ex7);
            $('#ex7-output').removeClass('show');
            $('#ex7-error').removeClass('show');
            hints.ex7.count = 0;
            $('#ex7-hint-count').text('0/2');
            completed.ex7 = false;
            $('#badge-7').removeClass('complete').html('7');
        });

        $(document).on('click', '#ex7-run', function() {
            var code = $('#ex7-code').val();
            $('#ex7-error').removeClass('show');
            $('#ex7-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex7-error-text').text(result.error);
                $('#ex7-error').addClass('show');
                return;
            }

            if (code.indexOf('toast.info') !== -1) {
                completed.ex7 = true;
                $('#ex7-output').addClass('show');
                updateProgress();
            }
        });

        // Exercise 8: Quick Alert Modal
        $(document).on('click', '#ex8-hint', function() {
            var h = hints.ex8;
            h.count = Math.min(h.count + 1, 2);
            $('#ex8-hint-count').text(h.count + '/2');
            $('#ex8-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex8-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex8-reset', function() {
            $('#ex8-code').val(defaults.ex8);
            $('#ex8-output').removeClass('show');
            $('#ex8-error').removeClass('show');
            hints.ex8.count = 0;
            $('#ex8-hint-count').text('0/2');
            completed.ex8 = false;
            $('#badge-8').removeClass('complete').html('8');
        });

        $(document).on('click', '#ex8-run', function() {
            var code = $('#ex8-code').val();
            $('#ex8-error').removeClass('show');
            $('#ex8-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex8-error-text').text(result.error);
                $('#ex8-error').addClass('show');
                return;
            }

            setTimeout(function() {
                if ($('.sit-modal-backdrop').length > 0 && code.indexOf('SITModal.alert') !== -1) {
                    completed.ex8 = true;
                    $('#ex8-output').addClass('show');
                    updateProgress();
                }
            }, 200);
        });

        // Exercise 9: Multiple Toasts
        $(document).on('click', '#ex9-hint', function() {
            var h = hints.ex9;
            h.count = Math.min(h.count + 1, 2);
            $('#ex9-hint-count').text(h.count + '/2');
            $('#ex9-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex9-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex9-reset', function() {
            $('#ex9-code').val(defaults.ex9);
            $('#ex9-output').removeClass('show');
            $('#ex9-error').removeClass('show');
            hints.ex9.count = 0;
            $('#ex9-hint-count').text('0/2');
            completed.ex9 = false;
            $('#badge-9').removeClass('complete').html('9');
        });

        $(document).on('click', '#ex9-run', function() {
            var code = $('#ex9-code').val();
            $('#ex9-error').removeClass('show');
            $('#ex9-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex9-error-text').text(result.error);
                $('#ex9-error').addClass('show');
                return;
            }

            // Check for multiple toast calls
            var infoCount = (code.match(/toast\.info/g) || []).length;
            var successCount = (code.match(/toast\.success/g) || []).length;
            if (infoCount >= 2 && successCount >= 1) {
                completed.ex9 = true;
                $('#ex9-output').addClass('show');
                updateProgress();
            }
        });

        // Exercise 10: Large Modal with Rich Content
        $(document).on('click', '#ex10-hint', function() {
            var h = hints.ex10;
            h.count = Math.min(h.count + 1, 2);
            $('#ex10-hint-count').text(h.count + '/2');
            $('#ex10-code').val(h.steps[h.count]);
            if (h.count >= 2) {
                setTimeout(function() { $('#ex10-run').trigger('click'); }, 300);
            }
        });

        $(document).on('click', '#ex10-reset', function() {
            $('#ex10-code').val(defaults.ex10);
            $('#ex10-output').removeClass('show');
            $('#ex10-error').removeClass('show');
            hints.ex10.count = 0;
            $('#ex10-hint-count').text('0/2');
            completed.ex10 = false;
            $('#badge-10').removeClass('complete').html('10');
        });

        $(document).on('click', '#ex10-run', function() {
            var code = $('#ex10-code').val();
            $('#ex10-error').removeClass('show');
            $('#ex10-output').removeClass('show');

            var result = executeCode(code);
            if (!result.success) {
                $('#ex10-error-text').text(result.error);
                $('#ex10-error').addClass('show');
                return;
            }

            setTimeout(function() {
                if ($('.sit-modal-backdrop').length > 0 &&
                    code.indexOf("size: 'lg'") !== -1 &&
                    (code.indexOf('<ul>') !== -1 || code.indexOf('<li>') !== -1)) {
                    completed.ex10 = true;
                    $('#ex10-output').addClass('show');
                    updateProgress();
                }
            }, 200);
        });

        console.log('SIT Exercises: All 10 exercise handlers attached!');
    });
});
