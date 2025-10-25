# game/views.py
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from decimal import Decimal
import json
import random
from django.urls import reverse # Убедитесь, что это импортировано!
from django.db.models import F

from game.models import GameAttempt
from pages.models import GameClick
from accounts.models import CustomUser


def case_silver(request):
    return render(request, 'game/case_silver.html')

def case_bronze(request):
    return render(request, 'game/case_bronze.html')

def case_gold(request):
    return render(request, 'game/case_gold.html')

def craps(request):
    return render(request, 'game/craps.html')

def fortune(request):
    return render(request, 'game/fortune.html')

def punto_banco(request):
    return render(request, 'game/punto_banco.html')


def Blackjack(request):
    # GameClick создается функцией track_game_click при переходе на эту страницу
    return render(request, 'game/Blackjack.html')

def roulette(request):
    # GameClick создается функцией track_game_click при переходе на эту страницу
    return render(request, 'game/roulette.html')

def blingo(request):
    if request.user.is_authenticated:
        user = request.user
        today = timezone.now().date()

        # Daily reset logic
        if user.last_blingo_play_date != today:
            user.blingo_plays_today = 0
            user.blingo_balance = 1000
            user.last_blingo_play_date = today
            user.save()

        # The check for plays is now handled by JavaScript
        game_name = 'blingo'
        try:
            game_click = GameClick.objects.create(
                user=request.user,
                game_name=game_name,
                target_url=request.path,
                current_balance=request.user.blingo_balance
            )
            request.session['last_game_click_id'] = game_click.id
            request.session.modified = True
        except Exception as e:
            print(f"Ошибка при сохранении GameClick для Blingo (поиск чисел): {e}")
            request.session['last_game_click_id'] = None
    return render(request, 'game/blingo.html')

def blinko(request):
    if not request.user.is_authenticated:
        return redirect('login')

    user = request.user
    today = timezone.now().date()

    # Daily reset logic
    if user.last_blinko_play_date != today:
        user.blinko_plays_today = 0
        user.last_blinko_play_date = today
        user.save()

    # Check attempts before incrementing
    if user.blinko_plays_today >= 3:
        messages.error(request, 'Вы уже использовали все свои попытки в Plinko на сегодня.')
        return redirect('index')
    
    # Increment on every page visit
    user.blinko_plays_today += 1
    user.save()

    # Logic to create GameClick for tracking balance
    game_name = 'blinko'
    try:
        game_click = GameClick.objects.create(
            user=request.user,
            game_name=game_name,
            target_url=request.path,
            current_balance=request.user.blinko_balance
        )
        request.session['blinko_game_click_id'] = game_click.id
    except Exception as e:
        print(f"Ошибка при сохранении GameClick для Plinko: {e}")
        request.session['blinko_game_click_id'] = None
    
    context = {
        'attempts_today': user.blinko_plays_today,
        'max_attempts': 3
    }
    return render(request, 'game/blinko.html', context)


@csrf_exempt
@login_required
def start_blingo_play(request):
    if request.method == 'POST':
        user = CustomUser.objects.get(pk=request.user.pk)
        today = timezone.now().date()
        if user.last_blingo_play_date != today:
            user.blingo_plays_today = 0
            user.last_blingo_play_date = today
            user.save()

        if user.blingo_plays_today < 3:
            user.blingo_plays_today += 1
            user.save()
            return JsonResponse({'status': 'success', 'plays_remaining': 3 - user.blingo_plays_today})
        else:
            return JsonResponse({'status': 'failure', 'message': 'Вы уже использовали все свои попытки в Blingo на сегодня.'})
    return JsonResponse({'status': 'error', 'message': 'Only POST allowed'}, status=405)


@login_required
def check_blingo_attempts(request):
    user = CustomUser.objects.get(pk=request.user.pk)
    today = timezone.now().date()
    if user.last_blingo_play_date != today:
        user.blingo_plays_today = 0
        user.last_blingo_play_date = today
        user.save()
    
    can_play = user.blingo_plays_today < 3
    return JsonResponse({
        'can_play': can_play,
        'attempts_today': user.blingo_plays_today,
        'max_attempts': 3
    })

@csrf_exempt
@login_required
def save_game_attempt(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            game_score = data.get('game_score', 0)
            
            # Add winnings to the main balance
            request.user.balance += Decimal(str(game_score))
            request.user.save()

            attempt = GameAttempt.objects.create(
                user=request.user,
                game_name='blingo',
                attempts_count=data.get('attempts_count', 0),
                game_score=game_score,
                result=data.get('result', 'unknown')
            )
            return JsonResponse({
                'status': 'success', 
                'attempt_id': attempt.id,
                'new_balance': float(request.user.balance)
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Only POST allowed'}, status=405)


@csrf_exempt
@login_required
def save_blinko_score(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            game_score = data.get('game_score', 0)
            game_name_from_js = data.get('game_name', 'blinko')

            if game_name_from_js != 'blinko':
                return JsonResponse({'status': 'error', 'message': 'Invalid game_name for Blinko (Plinko) save.'}, status=400)

            result = data.get('result', 'manual_exit')

            # Add winnings to the main balance
            request.user.balance += Decimal(str(game_score))
            request.user.save()
            
            # Update the session with the new main balance
            request.session['balance'] = float(request.user.balance)
            request.session.modified = True

            GameAttempt.objects.create(
                user=request.user,
                game_name=game_name_from_js,
                game_score=game_score,
                result=result,
                attempts_count=1
            )

            blinko_game_click_id = request.session.get('blinko_game_click_id')
            if blinko_game_click_id:
                try:
                    game_click = GameClick.objects.get(id=blinko_game_click_id, user=request.user, game_name='blinko')
                    # The `new_balance` in GameClick will now store the updated main balance
                    game_click.new_balance = request.user.balance
                    game_click.save()
                    
                    del request.session['blinko_game_click_id']
                    request.session.modified = True
                except GameClick.DoesNotExist:
                    print(f"Предупреждение: GameClick с ID {blinko_game_click_id} не найден для Plinko.")
                except Exception as e:
                    print(f"Ошибка при обновлении GameClick для Plinko: {e}")

            if 'blinko_attempt_counted' in request.session:
                del request.session['blinko_attempt_counted']
                request.session.modified = True

            return JsonResponse({
                'status': 'success',
                'new_balance': float(request.user.balance),
                'redirect_url': reverse('index')
            })
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Only POST allowed'}, status=405)


@login_required
def update_redirect(request):
    if request.method == 'POST':
        game_name_from_post = request.POST.get('game_name')
        balance_param = request.POST.get('new_balance') or request.POST.get('balance')

        game_click_id = request.session.get('last_game_click_id')
        
        updated_successfully = False
        message = 'Ошибка: Не удалось обновить баланс.'
        new_balance_value = None
        redirect_url = None

        if game_click_id and balance_param is not None:
            try:
                game_click = GameClick.objects.get(id=game_click_id, user=request.user)
                new_user_balance = Decimal(balance_param)

                if game_click.game_name == 'blingo':
                    # Calculate the winnings
                    winnings = new_user_balance - game_click.current_balance
                    # Add winnings to the main balance
                    request.user.balance += winnings
                    # Update the blingo_balance to the new value after the game
                    request.user.blingo_balance = new_user_balance
                    request.session['blingo_balance'] = float(new_user_balance)
                    request.session['balance'] = float(request.user.balance)
                else:
                    request.user.balance = new_user_balance
                    request.session['balance'] = float(new_user_balance)
                
                request.user.save()
                request.session.modified = True

                game_click.new_balance = new_user_balance
                game_click.save()

                del request.session['last_game_click_id']
                if 'last_game_name' in request.session:
                    del request.session['last_game_name']
                request.session.modified = True

                updated_successfully = True
                message = f'Баланс для {game_click.game_name} обновлен.'
                new_balance_value = float(new_user_balance)
                redirect_url = reverse('index')

                if game_click.game_name == 'blingo' and 'blingo_attempt_counted' in request.session:
                    del request.session['blingo_attempt_counted']
                    request.session.modified = True

            except GameClick.DoesNotExist:
                message = 'GameClick не найден, но баланс мог быть обновлен.'
                # Fallback logic to update balance anyway
            except (ValueError, AttributeError) as e:
                message = f"Ошибка при обновлении баланса: {str(e)}"
        
        if not updated_successfully and balance_param is not None:
            try:
                new_user_balance = Decimal(balance_param)
                if game_name_from_post == 'blingo':
                    # This is a fallback, the logic with GameClick should be the primary one.
                    # It's harder to calculate winnings here without the initial balance.
                    # For simplicity, we'll just update the blingo_balance.
                    # A better implementation would ensure GameClick always exists.
                    request.user.blingo_balance = new_user_balance
                else:
                    request.user.balance = new_user_balance
                request.user.save()
                updated_successfully = True
                message = f'Баланс пользователя обновлен (без GameClick). Имя игры: {game_name_from_post}.'
                new_balance_value = float(new_user_balance)
                redirect_url = reverse('index')
            except (ValueError, AttributeError) as e:
                message = f"Ошибка при обновлении баланса пользователя: {str(e)}"

        if updated_successfully:
            return JsonResponse({
                'status': 'success',
                'message': message,
                'new_balance': new_balance_value,
                'redirect_url': redirect_url
            })
        else:
            return JsonResponse({'status': 'error', 'message': message}, status=400)

    return JsonResponse({'status': 'error', 'message': 'Ожидается POST запрос.'}, status=400)


@login_required
def reset_blinko_attempts(request):
    user = request.user
    user.blinko_plays_today = 0
    user.last_blinko_play_date = None # Set to None to ensure a reset on next visit
    user.save()
    messages.success(request, 'Ваши попытки для игры Blinko были успешно сброшены.')
    return redirect('index')

@csrf_exempt
@login_required
def update_blackjack_balance(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            balance_str = data.get('balance')
            
            if not balance_str:
                return JsonResponse({'status': 'error', 'message': 'Balance parameter is required'}, status=400)
            
            new_balance = Decimal(str(balance_str))
            game_click_id = request.session.get('last_game_click_id')
            
            updated_successfully = False
            message = 'Ошибка: Не удалось обновить баланс.'
            new_balance_value = None

            if game_click_id:
                try:
                    game_click = GameClick.objects.get(id=game_click_id, user=request.user)
                    request.user.balance = new_balance
                    request.user.save()
                    
                    request.session['balance'] = float(new_balance)
                    request.session.modified = True

                    game_click.new_balance = new_balance
                    game_click.total = new_balance - game_click.current_balance
                    game_click.save()

                    del request.session['last_game_click_id']
                    if 'last_game_name' in request.session:
                        del request.session['last_game_name']
                    request.session.modified = True

                    updated_successfully = True
                    message = f'Баланс для {game_click.game_name} обновлен.'
                    new_balance_value = float(new_balance)

                except GameClick.DoesNotExist:
                    message = 'GameClick не найден, но баланс мог быть обновлен.'
                except (ValueError, AttributeError) as e:
                    message = f"Ошибка при обновлении баланса: {str(e)}"
            
            if not updated_successfully:
                try:
                    request.user.balance = new_balance
                    request.user.save()
                    updated_successfully = True
                    message = 'Баланс пользователя обновлен (без GameClick).'
                    new_balance_value = float(new_balance)
                    
                    request.session['balance'] = float(new_balance)
                    request.session.modified = True
                    
                except (ValueError, AttributeError) as e:
                    message = f"Ошибка при обновлении баланса пользователя: {str(e)}"

            if updated_successfully:
                return JsonResponse({
                    'status': 'success',
                    'message': message,
                    'new_balance': new_balance_value
                })
            else:
                return JsonResponse({'status': 'error', 'message': message}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    
    return JsonResponse({'status': 'error', 'message': 'Only POST requests are allowed'}, status=405)

@csrf_exempt
@login_required
def update_roulette_balance(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            balance_str = data.get('balance')
            
            if not balance_str:
                return JsonResponse({'status': 'error', 'message': 'Balance parameter is required'}, status=400)
            
            new_balance = Decimal(str(balance_str))
            game_click_id = request.session.get('last_game_click_id')
            game_name_from_post = data.get('game_name', 'roulette')  # по умолчанию roulette
            
            updated_successfully = False
            message = 'Ошибка: Не удалось обновить баланс.'
            new_balance_value = None

            # Логика с GameClick (как в update_redirect)
            if game_click_id and balance_str is not None:
                try:
                    game_click = GameClick.objects.get(id=game_click_id, user=request.user)
                    new_user_balance = new_balance

                    if game_click.game_name == 'blingo':
                        # Calculate the winnings
                        winnings = new_user_balance - game_click.current_balance
                        # Add winnings to the main balance
                        request.user.balance += winnings
                        # Update the blingo_balance to the new value after the game
                        request.user.blingo_balance = new_user_balance
                        request.session['blingo_balance'] = float(new_user_balance)
                        request.session['balance'] = float(request.user.balance)
                    else:
                        # Для рулетки и других игр
                        request.user.balance = new_user_balance
                        request.session['balance'] = float(new_user_balance)
                    
                    request.user.save()
                    request.session.modified = True

                    # Обновляем GameClick
                    game_click.new_balance = new_user_balance
                    game_click.total = new_user_balance - game_click.current_balance
                    game_click.save()

                    # Очищаем сессию
                    del request.session['last_game_click_id']
                    if 'last_game_name' in request.session:
                        del request.session['last_game_name']
                    request.session.modified = True

                    updated_successfully = True
                    message = f'Баланс для {game_click.game_name} обновлен.'
                    new_balance_value = float(new_user_balance)

                    if game_click.game_name == 'blingo' and 'blingo_attempt_counted' in request.session:
                        del request.session['blingo_attempt_counted']
                        request.session.modified = True

                except GameClick.DoesNotExist:
                    message = 'GameClick не найден, но баланс мог быть обновлен.'
                    # Fallback логика ниже
                except (ValueError, AttributeError) as e:
                    message = f"Ошибка при обновлении баланса: {str(e)}"
            
            # Fallback логика если GameClick не найден
            if not updated_successfully and balance_str is not None:
                try:
                    new_user_balance = new_balance
                    if game_name_from_post == 'blingo':
                        request.user.blingo_balance = new_user_balance
                    else:
                        request.user.balance = new_user_balance
                    request.user.save()
                    updated_successfully = True
                    message = f'Баланс пользователя обновлен (без GameClick). Имя игры: {game_name_from_post}.'
                    new_balance_value = float(new_user_balance)
                    
                    # Обновляем сессию
                    request.session['balance'] = float(new_user_balance)
                    request.session.modified = True
                    
                except (ValueError, AttributeError) as e:
                    message = f"Ошибка при обновлении баланса пользователя: {str(e)}"

            if updated_successfully:
                return JsonResponse({
                    'status': 'success',
                    'message': message,
                    'new_balance': new_balance_value
                })
            else:
                return JsonResponse({'status': 'error', 'message': message}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    
    return JsonResponse({'status': 'error', 'message': 'Only POST requests are allowed'}, status=405)



